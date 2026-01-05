"use server"

import { cookies } from "next/headers";

import { AttendancePageClient } from "./AttendancePageClient";
import { fetchAttendanceRecords } from "@/features/attendance";

export default async function AttendancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;

  const initialAttendance = await fetchAttendanceRecords(token ?? undefined, 30);

  return <AttendancePageClient initialAttendance={initialAttendance} />;
}
