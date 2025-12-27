import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Button, Input, DatePicker } from '@/components/ui/FormComponents';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

export interface CreateCycleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    loading?: boolean;
}

const cycleSchema = yup.object().shape({
    title: yup.string().required('Cycle title is required'),
    startDate: yup.string().required('Start date is required'),
    endDate: yup.string().required('End date is required')
        .test('is-after-start', 'End date must be after start date', function (value) {
            const { startDate } = this.parent;
            if (!startDate || !value) return true;
            return new Date(value) >= new Date(startDate);
        })
});

type CycleFormData = yup.InferType<typeof cycleSchema>;

export function CreateCycleModal({ isOpen, onClose, onSubmit, loading }: CreateCycleModalProps) {
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CycleFormData>({
        resolver: yupResolver(cycleSchema),
        defaultValues: {
            title: '',
            startDate: '',
            endDate: ''
        }
    });

    const onFormSubmit = (data: CycleFormData) => {
        onSubmit(data);
        reset();
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                                                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                                                    <div>
                                                        <Input
                                                            label="Cycle Title"
                                                            placeholder="e.g., Q1 2025 Performance Review"
                                                            required
                                                            error={errors.title?.message}
                                                            {...register('title')}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Controller
                                                                control={control}
                                                                name="startDate"
                                                                render={({ field }) => (
                                                                    <DatePicker
                                                                        label="Start Date"
                                                                        required
                                                                        value={field.value}
                                                                        onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                                                        error={errors.startDate?.message}
                                                                    />
                                                                )}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Controller
                                                                control={control}
                                                                name="endDate"
                                                                render={({ field }) => (
                                                                    <DatePicker
                                                                        label="End Date"
                                                                        required
                                                                        value={field.value}
                                                                        onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                                                        error={errors.endDate?.message}
                                                                    />
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                        <Button type="submit" className="w-full sm:ml-3 sm:w-auto" loading={loading}>
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
