import { redirect } from "next/navigation";

export default async function LegacyEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/advisor/students/${id}/evaluation`);
}
