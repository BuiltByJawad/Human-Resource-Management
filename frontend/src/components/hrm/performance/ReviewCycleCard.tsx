import { CalendarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/FormComponents';
import type { ReviewCycle } from '@/features/performance';

export interface ReviewCycleCardProps {
    cycle: ReviewCycle;
    onSelect: (cycle: ReviewCycle) => void;
    isSubmitted?: boolean;
}

export function ReviewCycleCard({ cycle, onSelect, isSubmitted = false }: ReviewCycleCardProps) {
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);
    const now = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div
            className={`group bg-white overflow-hidden shadow-sm rounded-xl border transition-all duration-300 relative ${isSubmitted ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:shadow-lg hover:border-blue-200 cursor-pointer'
                }`}
            onClick={() => !isSubmitted && onSelect(cycle)}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div
                    className={`h-full ${cycle.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {cycle.title}
                        </h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500 space-x-3">
                            <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    {isSubmitted ? (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-green-100 text-green-700 border-green-200 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Submitted
                        </span>
                    ) : (
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${cycle.status === 'active'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                            {cycle.status.toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        <span>{daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Ended'}</span>
                    </div>
                    <Button
                        variant={isSubmitted ? "secondary" : "primary"}
                        className={`text-xs ${isSubmitted ? 'opacity-50 cursor-not-allowed' : 'group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'}`}
                        disabled={isSubmitted}
                    >
                        {isSubmitted ? 'Completed' : (cycle.status === 'active' ? 'Start Review' : 'View Details')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
