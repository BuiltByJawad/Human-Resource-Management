export interface CreateJobDto {
    title: string;
    department?: string;
    location?: string;
    type?: 'full-time' | 'part-time' | 'contract';
    description?: string;
    requirements?: string[];
}

export interface CreateApplicationDto {
    jobId: string;
    candidateName: string;
    candidateEmail: string;
    phone?: string;
    resume?: string;
}

export interface RecruitmentQueryDto {
    page?: number;
    limit?: number;
    status?: string;
    jobId?: string;
}
