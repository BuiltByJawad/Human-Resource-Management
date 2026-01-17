"use client";

import React from 'react';
import { EmployeeTraining } from '@/services/training/types'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface CourseCardProps {
    training: EmployeeTraining;
}

export const CourseCard: React.FC<CourseCardProps> = ({ training }) => {
    const router = useRouter();
    const { course, status, progress } = training;

    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow bg-white">
            <div className="h-32 bg-gray-900 flex items-center justify-center relative">
                <PlayCircleIcon className="w-12 h-12 text-white opacity-80" />
                <div className="absolute top-2 right-2">
                    <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
                        {status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'Assigned'}
                    </Badge>
                </div>
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                    {course.description || 'No description available.'}
                </p>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <Button
                    className="w-full"
                    onClick={() => router.push(`/portal/training/${training.id}`)}
                    variant={status === 'completed' ? 'outline' : 'default'}
                >
                    {status === 'assigned' ? 'Start Course' : status === 'completed' ? 'Review Course' : 'Continue'}
                </Button>
            </CardFooter>
        </Card>
    );
};
