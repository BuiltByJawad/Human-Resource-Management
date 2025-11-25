import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/FormComponents';

export interface CreateCycleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export function CreateCycleModal({ isOpen, onClose, onSubmit }: CreateCycleModalProps) {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ title, startDate, endDate });
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <CalendarIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                                Create New Review Cycle
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 mb-4">
                                                    Set up a new performance review cycle for the organization.
                                                </p>
                                                <form onSubmit={handleSubmit} className="space-y-4">
                                                    <div>
                                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Cycle Title</label>
                                                        <input
                                                            type="text"
                                                            id="title"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                            placeholder="e.g., Q1 2025 Performance Review"
                                                            value={title}
                                                            onChange={(e) => setTitle(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                                                            <input
                                                                type="date"
                                                                id="startDate"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                                value={startDate}
                                                                onChange={(e) => setStartDate(e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                                                            <input
                                                                type="date"
                                                                id="endDate"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                                value={endDate}
                                                                onChange={(e) => setEndDate(e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                        <Button type="submit" className="w-full sm:ml-3 sm:w-auto">
                                                            Create Cycle
                                                        </Button>
                                                        <Button type="button" variant="secondary" className="mt-3 w-full sm:mt-0 sm:w-auto" onClick={onClose}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
