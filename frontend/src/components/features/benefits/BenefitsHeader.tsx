interface BenefitsHeaderProps {
  title: string
  subtitle: string
}

export function BenefitsHeader({ title, subtitle }: BenefitsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
  )
}
