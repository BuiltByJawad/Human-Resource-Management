import api from '@/lib/axios';

export interface Shift {
    id: string;
    employeeId: string;
    startTime: string;
    endTime: string;
    type: string;
    location?: string;
    status: string;
    employee?: {
        firstName: string;
        lastName: string;
    };
}

export const shiftService = {
    getShifts: async (startDate: string, endDate: string) => {
        try {
            const response = await api.get<{ data: Shift[] }>(`/shifts?startDate=${startDate}&endDate=${endDate}`);
            return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch (error) {
            console.error('Failed to fetch shifts:', error);
            return [];
        }
    },

    requestSwap: async (shiftId: string, reason?: string, targetId?: string) => {
        const response = await api.post('/shifts/swap', { shiftId, reason, targetId });
        return response.data;
    },

    // Admin/Manager functions
    scheduleShift: async (data: any) => {
        const response = await api.post('/shifts', data);
        return response.data;
    }
};
