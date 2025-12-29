'use client'

import React, { useState } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
    DropAnimation,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Card } from '../ui/FormComponents'
import { UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import type {
    Applicant as ApplicantBase,
    ApplicantStatus as ApplicantStatusBase,
    JobPosting as JobPostingBase,
} from '@/types/hrm'

// Interfaces
export type JobPosting = JobPostingBase

export type Applicant = ApplicantBase

export type ApplicantStatus = ApplicantStatusBase

const COLUMNS: { id: ApplicantStatus; title: string; color: string; borderColor: string }[] = [
    { id: 'applied', title: 'Applied', color: 'text-blue-600', borderColor: 'border-blue-500' },
    { id: 'screening', title: 'Screening', color: 'text-indigo-600', borderColor: 'border-indigo-500' },
    { id: 'interview', title: 'Interview', color: 'text-purple-600', borderColor: 'border-purple-500' },
    { id: 'offer', title: 'Offer', color: 'text-pink-600', borderColor: 'border-pink-500' },
    { id: 'hired', title: 'Hired', color: 'text-green-600', borderColor: 'border-green-500' },
    { id: 'rejected', title: 'Rejected', color: 'text-red-600', borderColor: 'border-red-500' },
]

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
}

// Draggable Applicant Card
function SortableApplicantCard({ applicant, isOverlay = false }: { applicant: Applicant, isOverlay?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: applicant.id, data: { type: 'Applicant', applicant } })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    const initials = `${applicant.firstName[0]}${applicant.lastName[0]}`.toUpperCase()
    const date = new Date(applicant.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const column = COLUMNS.find(c => c.id === applicant.status)
    const borderColor = column?.borderColor || 'border-gray-200'

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group relative bg-white p-4 rounded-lg shadow-sm mb-3 cursor-grab active:cursor-grabbing transition-all duration-200 border-l-4 ${borderColor}
                ${isOverlay ? 'shadow-2xl scale-105 rotate-2 z-50' : 'hover:shadow-md hover:-translate-y-0.5 border-t border-r border-b border-gray-100'}
            `}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {initials}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">{applicant.firstName} {applicant.lastName}</h4>
                        <span className="text-xs text-gray-400 flex items-center mt-0.5">
                            {date}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center text-xs text-gray-500">
                    <EnvelopeIcon className="h-3.5 w-3.5 mr-2 text-gray-400" />
                    <span className="truncate">{applicant.email}</span>
                </div>
                {applicant.phone && (
                    <div className="flex items-center text-xs text-gray-500">
                        <PhoneIcon className="h-3.5 w-3.5 mr-2 text-gray-400" />
                        <span>{applicant.phone}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// Droppable Column
function KanbanColumn({ id, title, color, applicants }: { id: ApplicantStatus, title: string, color: string, applicants: Applicant[] }) {
    const { setNodeRef } = useSortable({ id: id, data: { type: 'Column', id } })

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-80 flex flex-col h-full mr-4">
            <div className="flex items-center justify-between mb-4 px-1 border-b border-gray-200 pb-2">
                <h3 className={`font-bold text-sm uppercase tracking-wide ${color}`}>{title}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium py-0.5 px-2 rounded-full">
                    {applicants.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[150px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent px-1 pb-2">
                <SortableContext items={(Array.isArray(applicants) ? applicants : []).map(a => a.id)} strategy={verticalListSortingStrategy}>
                    {(Array.isArray(applicants) ? applicants : []).map(applicant => (
                        <SortableApplicantCard key={applicant.id} applicant={applicant} />
                    ))}
                </SortableContext>
                {applicants.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-300 text-xs italic border border-dashed border-gray-200 rounded-lg">
                        <span>No applicants</span>
                    </div>
                )}
            </div>
        </div>
    )
}

interface KanbanBoardProps {
    applicants: Applicant[]
    onStatusChange: (applicantId: string, newStatus: ApplicantStatus) => void
}

export function KanbanBoard({ applicants, onStatusChange }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeApplicant, setActiveApplicant] = useState<Applicant | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveId(active.id as string)
        if (active.data.current?.type === 'Applicant') {
            setActiveApplicant(active.data.current.applicant)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (!over) {
            setActiveId(null)
            setActiveApplicant(null)
            return
        }

        const activeId = active.id as string
        const overId = over.id as string

        const applicant = (Array.isArray(applicants) ? applicants : []).find(a => a.id === activeId)
        if (!applicant) return

        let newStatus: ApplicantStatus | undefined
        if ((Array.isArray(COLUMNS) ? COLUMNS : []).some(c => c.id === overId)) {
            newStatus = overId as ApplicantStatus
        } else {
            const overApplicant = (Array.isArray(applicants) ? applicants : []).find(a => a.id === overId)
            if (overApplicant) {
                newStatus = overApplicant.status
            }
        }

        if (newStatus && newStatus !== applicant.status) {
            onStatusChange(applicant.id, newStatus)
        }

        setActiveId(null)
        setActiveApplicant(null)
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full overflow-x-auto pb-4 px-2 snap-x">
                {COLUMNS.map(column => (
                    <KanbanColumn
                        key={column.id}
                        id={column.id}
                        title={column.title}
                        color={column.color}
                        applicants={(Array.isArray(applicants) ? applicants : []).filter(a => a.status === column.id)}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeApplicant ? (
                    <SortableApplicantCard applicant={activeApplicant} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
