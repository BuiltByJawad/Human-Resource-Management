
import api from '@/lib/axios';

export interface TrainingCourse {
    id: string;
    title: string;
    description?: string;
    contentUrl?: string; // YouTube link or file URL
    duration?: number;
    createdAt: string;
}

export interface EmployeeTraining {
    id: string;
    employeeId: string;
    courseId: string;
    status: 'assigned' | 'in-progress' | 'completed';
    progress: number;
    course: TrainingCourse;
}

export const trainingService = {
    // For Employees: Get their assigned courses
    getMyCourses: async () => {
        try {
            const response = await api.get<{ data: EmployeeTraining[] }>('/training/my-courses');
            return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch (error) {
            console.error('Failed to fetch training courses:', error);
            return [];
        }
    },

    // Update progress
    updateProgress: async (trainingId: string, progress: number) => {
        const response = await api.patch(`/training/${trainingId}/progress`, { progress });
        return response.data;
    },

    // Admin: List all courses
    getAllCourses: async () => {
        try {
            const response = await api.get<{ data: TrainingCourse[] }>('/training/courses');
            return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch (error) {
            console.error('Failed to fetch all courses:', error);
            return [];
        }
    },

    // Admin: Create course
    createCourse: async (data: Partial<TrainingCourse>) => {
        const response = await api.post('/training/courses', data);
        return response.data;
    },

    // Admin: Assign course
    assignCourse: async (employeeId: string, courseId: string) => {
        const response = await api.post('/training/assign', { employeeId, courseId });
        return response.data;
    }
};
