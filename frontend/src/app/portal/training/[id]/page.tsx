"use client";

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingService, EmployeeTraining } from '@/services/trainingService';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChevronLeftIcon, PlayIcon } from '@heroicons/react/24/outline';
import { handleCrudError } from '@/lib/apiError';
import { useToast } from '@/components/ui/ToastProvider';

export default function CoursePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const trainingId = params.id as string;

    const coursesQuery = useQuery<EmployeeTraining[]>({
        queryKey: ['training', 'my-courses'],
        queryFn: trainingService.getMyCourses,
        enabled: !!trainingId,
        staleTime: 5 * 60 * 1000,
        onError: (err) =>
            handleCrudError({
                error: err,
                resourceLabel: 'Training courses',
                showToast,
            }),
        initialData: [],
    });

    const training = useMemo(
        () => coursesQuery.data?.find((c) => c.id === trainingId) ?? null,
        [coursesQuery.data, trainingId]
    );

    const progressMutation = useMutation({
        mutationFn: (newProgress: number) => trainingService.updateProgress(trainingId, newProgress),
        onError: (err) =>
            handleCrudError({
                error: err,
                resourceLabel: 'Training progress',
                showToast,
            }),
        onSuccess: (_, newProgress) => {
            queryClient.setQueryData<EmployeeTraining[] | undefined>(['training', 'my-courses'], (prev) =>
                Array.isArray(prev)
                    ? prev.map((item) =>
                          item.id === trainingId
                              ? {
                                    ...item,
                                    progress: newProgress,
                                    status: newProgress === 100 ? 'completed' : 'in-progress',
                                }
                              : item
                      )
                    : prev
            );

            if (newProgress === 100) {
                setTimeout(() => router.push('/portal/training'), 1000);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['training', 'my-courses'] });
        },
    });

    const handleProgress = (newProgress: number) => {
        if (!training) return;
        progressMutation.mutate(newProgress);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">
                    <div className="max-w-4xl mx-auto">
                        {coursesQuery.isLoading ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-6 w-6" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-2/3" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                                <div className="grid gap-6 lg:grid-cols-3">
                                    <Skeleton className="aspect-video w-full lg:col-span-2" />
                                    <Skeleton className="h-48 w-full" />
                                </div>
                            </div>
                        ) : coursesQuery.isError ? (
                            <div className="text-red-600 text-sm">Failed to load course. Please try again.</div>
                        ) : !training ? (
                            <Card className="bg-white">
                                <CardContent className="py-10 text-center space-y-3">
                                    <p className="text-gray-700 font-semibold">Course not found</p>
                                    <p className="text-gray-500 text-sm">This course may have been unassigned or removed.</p>
                                    <Button variant="outline" onClick={() => router.push('/portal/training')}>
                                        Back to Training
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <Button variant="ghost" className="mb-4 pl-0" onClick={() => router.back()}>
                                    <ChevronLeftIcon className="w-4 h-4 mr-2" />
                                    Back to Courses
                                </Button>

                                <div className="flex flex-col gap-6">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{training.course.title}</h1>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>Duration: {training.course.duration || 60} mins</span>
                                            <span>•</span>
                                            <span>Status: {training.status}</span>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-3">
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Video Player Placeholder */}
                                            <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white relative group cursor-pointer shadow-lg">
                                                <PlayIcon className="w-16 h-16 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <p className="mt-4 font-medium">Video Content Placeholder</p>
                                                <p className="text-sm text-gray-400">({training.course.contentUrl || 'No source'})</p>
                                            </div>

                                            <Card className="bg-white">
                                                <CardContent className="pt-6">
                                                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Description</h3>
                                                    <p className="text-gray-600 leading-relaxed">
                                                        {training.course.description || 'No detailed description provided for this course.'}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="space-y-6">
                                            <Card className="bg-white">
                                                <CardContent className="pt-6">
                                                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Progress</h3>
                                                    <div className="space-y-2 mb-6">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">{training.progress}% Completed</span>
                                                        </div>
                                                        <Progress value={training.progress} className="h-3" />
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Button
                                                            className="w-full"
                                                            variant="outline"
                                                            onClick={() => handleProgress(Math.min(training.progress + 25, 100))}
                                                            disabled={progressMutation.isPending || training.progress >= 100}
                                                        >
                                                            Mark Next Lesson Complete (+25%)
                                                        </Button>

                                                        {training.progress < 100 && (
                                                            <Button
                                                                className="w-full"
                                                                variant="secondary"
                                                                onClick={() => handleProgress(100)}
                                                                disabled={progressMutation.isPending}
                                                            >
                                                                Complete Course Now
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
