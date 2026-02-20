'use client'

import dynamic from 'next/dynamic'
import type { DatePickerProps } from './DatePicker'

export type LazyDatePickerProps = DatePickerProps

const DynamicDatePicker = dynamic(() => import('./DatePicker').then((mod) => mod.DatePicker), {
  ssr: false,
  loading: () => <div className="h-10 w-full rounded-md border border-gray-300 bg-white" />
})

export function LazyDatePicker(props: LazyDatePickerProps) {
  return <DynamicDatePicker {...props} />
}
