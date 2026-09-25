"use client";

import { useParams, useSearchParams } from "next/navigation";
import AdvisorStudentRoute from "@/app/advisor/components/AdvisorStudentRoute";

export default function AdvisorRecordPage() {
  const params = useParams<{ recordId: string }>();
  const requestedView = useSearchParams().get("view");
  const view = requestedView === "progress" || requestedView === "supervision" ? requestedView : "overview";
  return <AdvisorStudentRoute recordId={params.recordId} view={view} />;
}
