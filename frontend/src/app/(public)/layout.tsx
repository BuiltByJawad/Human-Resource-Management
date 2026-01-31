import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/ToastProvider";

const DEFAULT_TITLE = "HRM Platform";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description:
    "A modern Human Resource Management platform with attendance, payroll, performance, and document workflows.",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <ToastProvider>
        <main className="min-h-screen">{children}</main>
      </ToastProvider>
    </div>
  );
}
