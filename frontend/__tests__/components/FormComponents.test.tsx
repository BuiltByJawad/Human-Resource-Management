import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button, Input, Select, Card } from '../../src/components/ui/FormComponents'

describe('Form Components', () => {
  describe('Button Component', () => {
    it('renders with primary variant by default', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-blue-600', 'text-white')
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-gray-200', 'text-gray-900')
      
      rerender(<Button variant="danger">Danger</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-red-600', 'text-white')
      
      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border', 'border-gray-300')
    })

    it('handles click events', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
    })

    it('renders different sizes correctly', () => {
      const { rerender } = render(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm')
      
      rerender(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base')
    })
  })

  describe('Input Component', () => {
    it('renders with label and placeholder', () => {
      render(
        <Input
          label="Email"
          placeholder="Enter your email"
          type="email"
        />
      )
      
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    })

    it('shows required indicator when required', () => {
      render(<Input label="Name" required />)
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('handles value changes', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test input' } })
      
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('displays error message when error prop is provided', () => {
      const errorMessage = 'This field is required'
      render(<Input error={errorMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveClass('border-red-300')
    })

    it('disables input when disabled', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })

  describe('Select Component', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ]

    it('renders with options', () => {
      render(
        <Select
          label="Choose option"
          value=""
          onChange={() => undefined}
          options={options}
        />
      )
      
      expect(screen.getByText('Choose option')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders all provided options', () => {
      render(<Select options={options} value="" onChange={() => undefined} />)

      fireEvent.click(screen.getByRole('button'))
      
      options.forEach(option => {
        expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument()
      })
    })

    it('handles value changes', () => {
      const handleChange = jest.fn()
      render(<Select options={options} value="" onChange={handleChange} />)
      
      fireEvent.click(screen.getByRole('button'))
      fireEvent.click(screen.getByRole('option', { name: 'Option 2' }))
      
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('shows error state and message', () => {
      const errorMessage = 'Please select an option'
      render(<Select options={options} value="" onChange={() => undefined} error={errorMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('border-red-300')
    })
  })

  describe('Card Component', () => {
    it('renders with title and content', () => {
      render(
        <Card title="Test Card">
          <p>Card content</p>
        </Card>
      )
      
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('renders without title', () => {
      render(
        <Card>
          <p>Content without title</p>
        </Card>
      )
      
      expect(screen.getByText('Content without title')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(
        <Card className="custom-class">
          <p>Custom card</p>
        </Card>
      )
      
      const card = screen.getByText('Custom card').closest('.bg-white')
      expect(card).toHaveClass('custom-class')
    })
  })
})