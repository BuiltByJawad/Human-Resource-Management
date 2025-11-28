"use client"

import React from 'react'

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4

export interface PasswordStrength {
  score: PasswordStrengthLevel
  label: string
}

const getStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, label: '' }
  }

  let score: PasswordStrengthLevel = 0
  const lengthScore = password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  const variety = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length

  score = (lengthScore + variety) as PasswordStrengthLevel
  if (score > 4) score = 4

  let label = 'Weak'
  if (score >= 4) label = 'Strong'
  else if (score === 3) label = 'Good'
  else if (score === 2) label = 'Fair'

  return { score, label }
}

interface PasswordStrengthBarProps {
  password: string
}

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ password }) => {
  const { score, label } = getStrength(password)

  if (!password) return null

  const segments = 4

  const getSegmentColor = (index: number) => {
    if (score === 0) return 'bg-gray-200'
    if (score <= 2) return index < score ? 'bg-red-500' : 'bg-gray-200'
    if (score === 3) return index < score ? 'bg-yellow-500' : 'bg-gray-200'
    return index < score ? 'bg-green-500' : 'bg-gray-200'
  }

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${getSegmentColor(i)}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">Password strength: {label}</p>
    </div>
  )
}
