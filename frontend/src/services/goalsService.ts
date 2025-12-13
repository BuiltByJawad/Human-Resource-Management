
import api from '@/lib/axios';

export interface KeyResult {
    id: string;
    goalId: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
}

export interface PerformanceGoal {
    id: string;
    title: string;
    description?: string;
    status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
    startDate: string;
    endDate?: string;
    keyResults: KeyResult[];
    progress?: number; // Calculated frontend side or backend
}

export const goalsService = {
    getMyGoals: async () => {
        try {
            const response = await api.get<{ data: PerformanceGoal[] }>('/goals/my-goals');
            return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            return [];
        }
    },

    createGoal: async (data: Partial<PerformanceGoal>) => {
        const response = await api.post('/goals', data);
        return response.data;
    },

    addKeyResult: async (data: Partial<KeyResult>) => {
        const response = await api.post('/goals/key-results', data);
        return response.data;
    },

    updateKeyResultProgress: async (id: string, currentValue: number) => {
        const response = await api.patch(`/goals/key-results/${id}`, { currentValue });
        return response.data;
    }
};
