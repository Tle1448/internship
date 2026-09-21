import { redirect } from "next/navigation";

export default async function LegacyHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/advisor/students/${id}/history`);
}
