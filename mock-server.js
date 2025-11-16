const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock data
const mockEmployees = [
  {
    id: '1',
    employeeNumber: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    department: 'Engineering',
    role: 'Senior Developer',
    hireDate: '2022-01-15',
    salary: 85000,
    status: 'active'
  },
  {
    id: '2',
    employeeNumber: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    department: 'Marketing',
    role: 'Marketing Manager',
    hireDate: '2021-06-20',
    salary: 75000,
    status: 'active'
  },
  {
    id: '3',
    employeeNumber: 'EMP003',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@company.com',
    department: 'Sales',
    role: 'Sales Representative',
    hireDate: '2023-03-10',
    salary: 65000,
    status: 'active'
  }
];

const mockDepartments = [
  {
    id: '1',
    name: 'Engineering',
    description: 'Software development and technical operations',
    managerId: '1',
    employeeCount: 15
  },
  {
    id: '2',
    name: 'Marketing',
    description: 'Marketing and brand management',
    managerId: '2',
    employeeCount: 8
  },
  {
    id: '3',
    name: 'Sales',
    description: 'Sales and business development',
    managerId: '3',
    employeeCount: 12
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock API server is running' });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@hrm.com' && password === 'admin123') {
    res.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'admin@hrm.com',
        role: 'super_admin',
        isActive: true
      },
      permissions: ['manage_employees', 'manage_departments', 'manage_payroll']
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token === 'mock-access-token') {
    res.json({
      id: '1',
      email: 'admin@hrm.com',
      role: 'super_admin',
      isActive: true
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Employees endpoints
app.get('/api/employees', (req, res) => {
  const { page = 1, limit = 10, search = '', department = '', status = '' } = req.query;
  
  let filteredEmployees = [...mockEmployees];
  
  if (search) {
    filteredEmployees = filteredEmployees.filter(emp => 
      emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (department) {
    filteredEmployees = filteredEmployees.filter(emp => emp.department === department);
  }
  
  if (status) {
    filteredEmployees = filteredEmployees.filter(emp => emp.status === status);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedEmployees,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredEmployees.length,
      totalPages: Math.ceil(filteredEmployees.length / limit)
    }
  });
});

app.get('/api/employees/:id', (req, res) => {
  const employee = mockEmployees.find(emp => emp.id === req.params.id);
  
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  
  res.json({ success: true, data: employee });
});

app.post('/api/employees', (req, res) => {
  const newEmployee = {
    id: String(mockEmployees.length + 1),
    employeeNumber: `EMP${String(mockEmployees.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'active'
  };
  
  mockEmployees.push(newEmployee);
  res.status(201).json({ success: true, data: newEmployee });
});

app.put('/api/employees/:id', (req, res) => {
  const index = mockEmployees.findIndex(emp => emp.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  
  mockEmployees[index] = { ...mockEmployees[index], ...req.body };
  res.json({ success: true, data: mockEmployees[index] });
});

app.delete('/api/employees/:id', (req, res) => {
  const index = mockEmployees.findIndex(emp => emp.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  
  mockEmployees.splice(index, 1);
  res.json({ success: true, message: 'Employee deleted successfully' });
});

// Departments endpoints
app.get('/api/departments', (req, res) => {
  res.json({ success: true, data: mockDepartments });
});

app.get('/api/departments/:id', (req, res) => {
  const department = mockDepartments.find(dept => dept.id === req.params.id);
  
  if (!department) {
    return res.status(404).json({ error: 'Department not found' });
  }
  
  res.json({ success: true, data: department });
});

app.post('/api/departments', (req, res) => {
  const newDepartment = {
    id: String(mockDepartments.length + 1),
    ...req.body,
    employeeCount: 0
  };
  
  mockDepartments.push(newDepartment);
  res.status(201).json({ success: true, data: newDepartment });
});

app.put('/api/departments/:id', (req, res) => {
  const index = mockDepartments.findIndex(dept => dept.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Department not found' });
  }
  
  mockDepartments[index] = { ...mockDepartments[index], ...req.body };
  res.json({ success: true, data: mockDepartments[index] });
});

app.delete('/api/departments/:id', (req, res) => {
  const index = mockDepartments.findIndex(dept => dept.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Department not found' });
  }
  
  mockDepartments.splice(index, 1);
  res.json({ success: true, message: 'Department deleted successfully' });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalEmployees: mockEmployees.length,
      activeEmployees: mockEmployees.filter(emp => emp.status === 'active').length,
      totalDepartments: mockDepartments.length,
      pendingLeaveRequests: 2,
      totalPayroll: 225000,
      attendanceRate: 94.5
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log('📊 Available endpoints:');
  console.log('  - POST /api/auth/login');
  console.log('  - GET  /api/employees');
  console.log('  - GET  /api/departments');
  console.log('  - GET  /api/dashboard/stats');
});