"use client";

import React, { useEffect, useState } from 'react';
import { trainingService, EmployeeTraining } from '@/services/trainingService';
import { CourseCard } from '@/components/modules/training/CourseCard';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';

export default function TrainingDashboard() {
    const [mounted, setMounted] = useState(false);
    const [trainings, setTrainings] = useState<EmployeeTraining[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const loadCourses = async () => {
            setLoading(true);
            try {
                const data = await trainingService.getMyCourses();
                setTrainings(data || []);
            } catch (error) {
                console.error('Failed to load courses:', error);
            } finally {
                setLoading(false);
            }
        };
        if (mounted) {
            loadCourses();
        }
    }, [mounted]);

    const inProgress = trainings.filter(t => t.status === 'in-progress' || t.status === 'assigned');
    const completed = trainings.filter(t => t.status === 'completed');

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
                            <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
                            <p className="text-gray-600">Access your assigned training courses and track your progress.</p>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <section>
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
                                        Active Courses
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{inProgress.length}</span>
                                    </h2>
                                    {inProgress.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {inProgress.map(t => <CourseCard key={t.id} training={t} />)}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No active courses. Great job!</p>
                                    )}
                                </section>

                                {completed.length > 0 && (
                                    <section>
                                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Completed</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                                            {completed.map(t => <CourseCard key={t.id} training={t} />)}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
