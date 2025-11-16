"use client";

import { Dialog } from "@headlessui/react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} className="relative z-[999]">
      <div className="fixed inset-0 bg-slate-900/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-4">
          <div>
            <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-slate-500 mt-1">
                {description}
              </Dialog.Description>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
