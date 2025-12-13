"use client";

import React, { useEffect, useState } from 'react';
import { goalsService, PerformanceGoal } from '@/services/goalsService';
import { CreateGoalDialog } from '@/components/modules/goals/CreateGoalDialog';
import { KeyResultList } from '@/components/modules/goals/KeyResultList';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlagIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function GoalsPage() {
    const [mounted, setMounted] = useState(false);
    const [goals, setGoals] = useState<PerformanceGoal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadGoals = async () => {
        setLoading(true);
        try {
            const data = await goalsService.getMyGoals();
            setGoals(data || []);
        } catch (error) {
            console.error('Failed to load goals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            loadGoals();
        }
    }, [mounted]);

    const calculateProgress = (goal: PerformanceGoal) => {
        if (!goal.keyResults || goal.keyResults.length === 0) return 0;
        const total = goal.keyResults.reduce((acc, kr) => {
            return acc + Math.min((kr.currentValue / kr.targetValue) * 100, 100);
        }, 0);
        return Math.round(total / goal.keyResults.length);
    };

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
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">My Goals & OKRs</h1>
                                <p className="text-gray-600">Track your performance objectives and key results.</p>
                            </div>
                            <CreateGoalDialog onSuccess={loadGoals} />
                        </div>

                        {loading ? (
                            <div className="text-gray-500">Loading...</div>
                        ) : goals.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                                {goals.map(goal => {
                                    const progress = calculateProgress(goal);
                                    return (
                                        <Card key={goal.id} className="group hover:border-blue-200 transition-colors bg-white">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                            <FlagIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg">{goal.title}</CardTitle>
                                                            <Badge variant="outline" className="mt-1 font-normal text-gray-500">
                                                                {goal.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <KeyResultList keyResults={goal.keyResults || []} onUpdate={loadGoals} />
                                            </CardContent>
                                            <CardFooter className="pt-2 border-t bg-gray-50 flex justify-between">
                                                <span className="text-xs text-gray-500">Due: {goal.endDate ? new Date(goal.endDate).toLocaleDateString() : 'No date'}</span>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border-dashed border-2">
                                <ArrowTrendingUpIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No Goals Set</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                                    Get started by defining your first performance objective.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
