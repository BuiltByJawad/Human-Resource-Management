import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Modal, Alert } from '../../src/components/ui/Modal'

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<Modal {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    
    rerender(<Modal {...defaultProps} size="lg" />)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    
    rerender(<Modal {...defaultProps} size="xl" />)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('renders children content correctly', () => {
    const complexChildren = (
      <div>
        <h2>Complex Content</h2>
        <p>This is a paragraph</p>
        <button>Action Button</button>
      </div>
    )
    
    render(<Modal {...defaultProps}>{complexChildren}</Modal>)
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument()
    expect(screen.getByText('This is a paragraph')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
  })
})

describe('Alert Component', () => {
  const defaultProps = {
    type: 'success' as const,
    message: 'Operation completed successfully'
  }

  it('renders success alert correctly', () => {
    render(<Alert {...defaultProps} />)
    
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
    expect(screen.getByText('Operation completed successfully').closest('.border')).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800')
  })

  it('renders error alert correctly', () => {
    render(<Alert {...defaultProps} type="error" message="An error occurred" />)
    
    expect(screen.getByText('An error occurred')).toBeInTheDocument()
    expect(screen.getByText('An error occurred').closest('.border')).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800')
  })

  it('renders warning alert correctly', () => {
    render(<Alert {...defaultProps} type="warning" message="Warning message" />)
    
    expect(screen.getByText('Warning message')).toBeInTheDocument()
    expect(screen.getByText('Warning message').closest('.border')).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800')
  })

  it('renders info alert correctly', () => {
    render(<Alert {...defaultProps} type="info" message="Information message" />)
    
    expect(screen.getByText('Information message')).toBeInTheDocument()
    expect(screen.getByText('Information message').closest('.border')).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800')
  })

  it('renders with title', () => {
    render(<Alert {...defaultProps} title="Success!" />)
    
    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<Alert {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<Alert {...defaultProps} className="custom-alert" />)
    
    expect(screen.getByText('Operation completed successfully').closest('.border')).toHaveClass('custom-alert')
  })

  it('does not render close button when onClose is not provided', () => {
    render(<Alert {...defaultProps} />)
    
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
  })

  it('renders outline variant correctly', () => {
    render(<Alert {...defaultProps} type="outline" message="Outline message" />)
    
    expect(screen.getByText('Outline message')).toBeInTheDocument()
    expect(screen.getByText('Outline message').closest('.border')).toHaveClass('bg-transparent', 'border', 'border-gray-300')
  })
})