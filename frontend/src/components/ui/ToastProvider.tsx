"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastInput {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface Toast extends ToastInput {
  id: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon className="h-5 w-5" />, 
  error: <ExclamationTriangleIcon className="h-5 w-5" />, 
  info: <InformationCircleIcon className="h-5 w-5" />, 
  warning: <ExclamationTriangleIcon className="h-5 w-5" />, 
};

const colorMap: Record<ToastType, string> = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-100",
  error: "bg-rose-50 text-rose-800 border-rose-100",
  info: "bg-slate-50 text-slate-800 border-slate-100",
  warning: "bg-amber-50 text-amber-800 border-amber-100",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, type = "info", duration = 4000 }: ToastInput) => {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
      const toast: Toast = { id, title, description, type };
      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-2xl shadow-lg px-4 py-3 flex items-start gap-3 animate-[fadeIn_0.2s_ease] ${colorMap[toast.type]}`}
          >
            <div className="mt-0.5 text-current">{iconMap[toast.type]}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-current">{toast.title}</p>
              {toast.description && (
                <p className="text-sm text-current/80 mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              className="text-current/60 hover:text-current"
              onClick={() => removeToast(toast.id)}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
