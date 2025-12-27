"use server"

import { cookies } from "next/headers";

import { AttendancePageClient } from "./AttendancePageClient";
import type { AttendanceRecord } from "@/components/hrm/AttendanceComponents";

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") : null) ||
    "http://localhost:5000"
  );
}

async function fetchAttendance(token: string | null): Promise<AttendanceRecord[]> {
  if (!token) return [];

  try {
    const base = buildApiBase();
    const response = await fetch(`${base}/api/attendance?limit=30`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json().catch(() => null);
    const root = payload?.data ?? payload;
    return Array.isArray(root) ? root : Array.isArray(root?.items) ? root.items : [];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Failed to fetch attendance records", error);
    }
    return [];
  }
}

export default async function AttendancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;

  const initialAttendance = await fetchAttendance(token);

  return <AttendancePageClient initialAttendance={initialAttendance} />;
}
