import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/FormComponents';

export interface ReviewFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    cycleTitle: string;
    readOnly?: boolean;
    initialData?: {
        ratings: Record<string, number>;
        comments: string;
    };
}

export function ReviewForm({ isOpen, onClose, onSubmit, cycleTitle, readOnly = false, initialData }: ReviewFormProps) {
    const [ratings, setRatings] = useState<Record<string, number>>({
        'Technical Proficiency': 0,
        'Code Quality': 0,
        'Problem Solving': 0,
        'Communication': 0,
        'Collaboration': 0,
        'Leadership': 0,
        'Initiative': 0,
        'Reliability': 0,
        ...(initialData?.ratings || {})
    });

    const categories = {
        'Core Competencies': ['Technical Proficiency', 'Code Quality', 'Problem Solving'],
        'Soft Skills': ['Communication', 'Collaboration'],
        'Values & Impact': ['Leadership', 'Initiative', 'Reliability']
    };

    const [comments, setComments] = useState(initialData?.comments || '');

    const handleRatingChange = (category: string, rating: number) => {
        if (readOnly) return;
        setRatings(prev => ({ ...prev, [category]: rating }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        onSubmit({ ratings, comments });
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white">
                                        {readOnly ? 'Review Details' : 'Performance Review'}
                                        <span className="block text-sm font-normal text-blue-100 mt-1">{cycleTitle}</span>
                                    </Dialog.Title>
                                </div>

                                <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-8">
                                        {Object.entries(categories).map(([groupName, skills]) => (
                                            <div key={groupName} className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                                                    {groupName}
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {skills.map((skill) => (
                                                        <div key={skill}>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <label className="text-sm font-medium text-gray-700">{skill}</label>
                                                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                                    {ratings[skill] > 0 ? `${ratings[skill]}/5` : '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => handleRatingChange(skill, star)}
                                                                        disabled={readOnly}
                                                                        className={`p-1 focus:outline-none transition-transform ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
                                                                    >
                                                                        {ratings[skill] >= star ? (
                                                                            <StarIcon className="h-7 w-7 text-yellow-400 drop-shadow-sm" />
                                                                        ) : (
                                                                            <StarIconOutline className="h-7 w-7 text-gray-300 hover:text-yellow-200" />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        <div>
                                            <label htmlFor="comments" className="block text-sm font-medium text-gray-900 mb-2">
                                                Additional Feedback & Goals
                                            </label>
                                            <textarea
                                                id="comments"
                                                name="comments"
                                                rows={4}
                                                disabled={readOnly}
                                                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border ${readOnly ? 'bg-gray-100 text-gray-600' : ''}`}
                                                value={comments}
                                                onChange={(e) => setComments(e.target.value)}
                                                placeholder={readOnly ? "No additional comments provided." : "Share specific examples of achievements, areas for improvement, and goals for the next cycle..."}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                        <Button variant="secondary" onClick={onClose}>
                                            {readOnly ? 'Close' : 'Cancel'}
                                        </Button>
                                        {!readOnly && (
                                            <Button type="submit">
                                                Submit Evaluation
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
