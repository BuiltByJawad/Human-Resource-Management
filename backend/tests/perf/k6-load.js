import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

let adminToken;
let employeeToken;
let loggedErrors = 0;

const unauthorizedCount = new Counter('unauthorized');
const serverErrorCount = new Counter('server_error');

export const options = {
  scenarios: {
    sustained: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
    },
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 0 },
      ],
      startTime: '2m',
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '15s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '15s', target: 10 },
      ],
      startTime: '4m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200'],
  },
};

function login(email, password) {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'login ok': (r) => r.status === 200 && r.json('data.accessToken') });
  return res.json('data.accessToken');
}

export function setup() {
  return {
    adminToken: login('admin@novahr.com', 'password123'),
    employeeToken: login('employee@novahr.com', 'password123'),
  };
}

function withAuthRetry(requestFn, role) {
  let response = requestFn();
  if (response.status === 401) {
    if (role === 'admin') {
      adminToken = login('admin@novahr.com', 'password123');
    } else {
      employeeToken = login('employee@novahr.com', 'password123');
    }
    response = requestFn();
  }
  if (response.status === 401) {
    unauthorizedCount.add(1);
  }
  if (response.status >= 500) {
    serverErrorCount.add(1);
  }
  if (response.status >= 400 && loggedErrors < 5) {
    loggedErrors += 1;
    console.log(`HTTP ${response.status} ${response.url}`);
    console.log(response.body);
  }
  return response;
}

export default function (data) {
  adminToken = adminToken || data.adminToken;
  employeeToken = employeeToken || data.employeeToken;

  const employeeHeaders = {
    Authorization: `Bearer ${employeeToken}`,
  };
  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`,
  };

  const profile = withAuthRetry(
    () => http.get(`${BASE_URL}/api/portal/profile`, { headers: employeeHeaders }),
    'employee'
  );
  check(profile, { 'profile ok': (r) => r.status === 200 });

  const employees = withAuthRetry(
    () => http.get(`${BASE_URL}/api/employees`, { headers: adminHeaders }),
    'admin'
  );
  check(employees, { 'employees ok': (r) => r.status === 200 });

  const attendance = withAuthRetry(
    () => http.get(`${BASE_URL}/api/attendance`, { headers: employeeHeaders }),
    'employee'
  );
  check(attendance, { 'attendance ok': (r) => r.status === 200 });

  const payroll = withAuthRetry(
    () => http.get(`${BASE_URL}/api/payroll`, { headers: adminHeaders }),
    'admin'
  );
  check(payroll, { 'payroll ok': (r) => r.status === 200 || r.status === 403 });

  sleep(1);
}
