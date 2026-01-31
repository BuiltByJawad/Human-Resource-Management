import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DataTable, StatsCard } from '../../src/components/ui/DataTable'
import { UsersIcon } from '@heroicons/react/24/outline'

describe('DataTable Component', () => {
  const mockData = [
    { id: '1', name: 'John Doe', email: 'john@example.com', department: 'Engineering' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales' }
  ]

  const columns = [
    { key: 'name' as const, header: 'Name' },
    { key: 'email' as const, header: 'Email' },
    { key: 'department' as const, header: 'Department' }
  ]

  it('renders table with headers and data', () => {
    render(<DataTable data={mockData} columns={columns} />)
    
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Department')).toBeInTheDocument()
    
    mockData.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument()
      expect(screen.getByText(item.email)).toBeInTheDocument()
      expect(screen.getByText(item.department)).toBeInTheDocument()
    })
  })

  it('handles pagination correctly', () => {
    const manyData = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      name: `Employee ${i + 1}`,
      email: `employee${i + 1}@example.com`,
      department: 'Engineering'
    }))

    const { container } = render(<DataTable data={manyData} columns={columns} pageSize={10} />)
    
    expect(container).toHaveTextContent('Showing 1 to 10 of 25 results')
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)
    
    expect(container).toHaveTextContent('Showing 11 to 20 of 25 results')
  })

  it('handles sorting when header is clicked', () => {
    render(<DataTable data={mockData} columns={columns} />)
    
    const nameHeader = screen.getByText('Name')
    fireEvent.click(nameHeader)
    
    expect(screen.getByText('↑')).toBeInTheDocument()
    
    fireEvent.click(nameHeader)
    expect(screen.getByText('↓')).toBeInTheDocument()
  })

  it('handles row click events', () => {
    const handleRowClick = jest.fn()
    render(<DataTable data={mockData} columns={columns} onRowClick={handleRowClick} />)
    
    const firstRow = screen.getByText('John Doe').closest('tr')
    fireEvent.click(firstRow!)
    
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('renders custom cell content when render function is provided', () => {
    const columnsWithRender = [
      ...columns,
      {
        key: 'name' as const,
        header: 'Formatted Name',
        render: (value: string) => `Dr. ${value}`
      }
    ]

    render(<DataTable data={mockData} columns={columnsWithRender} />)
    
    expect(screen.getByText('Dr. John Doe')).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    render(<DataTable data={[]} columns={columns} />)
    
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /john doe/i })).not.toBeInTheDocument()
  })
})

describe('StatsCard Component', () => {
  it('renders with title and value', () => {
    render(
      <StatsCard
        title="Total Users"
        value={1250}
        icon={UsersIcon}
      />
    )
    
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1250')).toBeInTheDocument()
  })

  it('renders with change indicator', () => {
    render(
      <StatsCard
        title="Revenue"
        value="$50,000"
        change="+12%"
        changeType="increase"
        icon={UsersIcon}
      />
    )
    
    expect(screen.getByText('$50,000')).toBeInTheDocument()
    expect(screen.getByText('↑ +12%')).toBeInTheDocument()
  })

  it('renders decrease indicator correctly', () => {
    render(
      <StatsCard
        title="Expenses"
        value="$25,000"
        change="-5%"
        changeType="decrease"
        icon={UsersIcon}
      />
    )
    
    expect(screen.getByText('↓ -5%')).toBeInTheDocument()
    expect(screen.getByText('↓ -5%').closest('div')).toHaveClass('text-red-600')
  })

  it('applies custom className', () => {
    render(
      <StatsCard
        title="Custom Card"
        value={100}
        icon={UsersIcon}
        className="custom-class"
      />
    )
    
    const card = screen.getByText('Custom Card').closest('.bg-white')
    expect(card).toHaveClass('custom-class')
  })

  it('renders icon correctly', () => {
    const { container } = render(
      <StatsCard
        title="Test Card"
        value={500}
        icon={UsersIcon}
      />
    )
    
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})