import api from '@/lib/axios';

export interface Project {
    id: string;
    name: string;
    description?: string;
    client?: string;
    status: string;
    startDate: string;
    endDate?: string;
}

export interface TimeEntry {
    id: string;
    employeeId: string;
    projectId?: string;
    project?: Project;
    date: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    description?: string;
    type: string;
    status: string;
    employee?: {
        firstName: string;
        lastName: string;
    };
}

export const timeTrackingService = {
    // Projects
    getProjects: async () => {
        try {
            const response = await api.get<{ data: Project[] }>('/time-tracking/projects');
            return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch {
            return [];
        }
    },

    createProject: async (data: Partial<Project>) => {
        const response = await api.post('/time-tracking/projects', data);
        return response.data;
    },

    // Time Entries
    getTimesheet: async (employeeId: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get<{ data: TimeEntry[] }>(`/time-tracking/timesheet/${employeeId}${query}`);
        return Array.isArray(response.data?.data) ? response.data.data : [];
    },

    clockIn: async (projectId?: string, description?: string) => {
        const response = await api.post('/time-tracking/clock-in', { projectId, description });
        return response.data;
    },

    clockOut: async () => {
        const response = await api.post('/time-tracking/clock-out');
        return response.data;
    },

    logManualEntry: async (data: {
        projectId?: string;
        date: string;
        startTime: string;
        endTime: string;
        description?: string;
        type?: string;
    }) => {
        const response = await api.post('/time-tracking/manual-entry', data);
        return response.data;
    },
};
