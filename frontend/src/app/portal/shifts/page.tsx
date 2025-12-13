"use client";

import React, { useEffect, useState } from 'react';
import { shiftService, Shift } from '@/services/shiftService';
import { ShiftCard } from '@/components/modules/shift/ShiftCard';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function ShiftsPage() {
    const [mounted, setMounted] = useState(false);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadShifts = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();
            const data = await shiftService.getShifts(start, end);
            setShifts(data || []);
        } catch (error) {
            console.error('Failed to load shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            loadShifts();
        }
    }, [currentDate, mounted]);

    const selectedDayShifts = shifts.filter(s =>
        new Date(s.startTime).getDate() === selectedDate.getDate() &&
        new Date(s.startTime).getMonth() === selectedDate.getMonth()
    );

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
                            <p className="text-gray-600">Manage your schedule and swap requests.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Simple Date Picker */}
                            <div className="md:col-span-4 lg:col-span-3">
                                <div className="border rounded-lg p-4 bg-white shadow-sm">
                                    <h3 className="font-medium text-gray-900 mb-4">Select Date</h3>
                                    <input
                                        type="date"
                                        value={format(selectedDate, 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const newDate = new Date(e.target.value);
                                            setSelectedDate(newDate);
                                            setCurrentDate(newDate);
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            {/* List View for Selected Day */}
                            <div className="md:col-span-8 lg:col-span-9">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                                    </h2>
                                </div>

                                {loading ? (
                                    <div className="text-gray-500">Loading shifts...</div>
                                ) : selectedDayShifts.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {selectedDayShifts.map(shift => (
                                            <ShiftCard key={shift.id} shift={shift} onSwapRequest={loadShifts} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-400 bg-white">
                                        No shifts scheduled for this day.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
