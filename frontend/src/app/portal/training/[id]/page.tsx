"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trainingService, EmployeeTraining } from '@/services/trainingService';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeftIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function CoursePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const trainingId = params.id as string;

    const [mounted, setMounted] = useState(false);
    const [training, setTraining] = useState<EmployeeTraining | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const loadTraining = async () => {
            try {
                const courses = await trainingService.getMyCourses();
                const found = courses.find(c => c.id === trainingId);
                if (found) setTraining(found);
            } catch (error) {
                console.error('Failed to load course:', error);
            } finally {
                setLoading(false);
            }
        };
        if (trainingId && mounted) loadTraining();
    }, [trainingId, mounted]);

    const handleProgress = async (newProgress: number) => {
        if (!training) return;
        setUpdating(true);
        try {
            await trainingService.updateProgress(training.id, newProgress);
            setTraining(prev => prev ? { ...prev, progress: newProgress, status: newProgress === 100 ? 'completed' : 'in-progress' } : null);
            if (newProgress === 100) {
                setTimeout(() => router.push('/portal/training'), 2000);
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
        } finally {
            setUpdating(false);
        }
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
                    <div className="max-w-4xl mx-auto">
                        {loading ? (
                            <div className="text-gray-500">Loading course content...</div>
                        ) : !training ? (
                            <div className="text-gray-500">Course not found.</div>
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
                                                            disabled={updating || training.progress >= 100}
                                                        >
                                                            Mark Next Lesson Complete (+25%)
                                                        </Button>

                                                        {training.progress < 100 && (
                                                            <Button
                                                                className="w-full"
                                                                variant="secondary"
                                                                onClick={() => handleProgress(100)}
                                                                disabled={updating}
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
