"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className = "",
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={`p-3 ${className}`}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative",
                day: "h-9 w-9 p-0 font-normal inline-flex items-center justify-center rounded-md hover:bg-gray-100",
                day_range_end: "day-range-end",
                day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                day_today: "bg-gray-100 text-gray-900",
                day_outside: "text-gray-400 opacity-50",
                day_disabled: "text-gray-400 opacity-50",
                day_range_middle: "aria-selected:bg-gray-100",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: (props: any) => {
                    if (props.orientation === "left") return <ChevronLeft className="h-4 w-4" {...props} />
                    if (props.orientation === "right") return <ChevronRight className="h-4 w-4" {...props} />
                    return <></>
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
