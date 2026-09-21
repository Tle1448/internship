import { redirect } from "next/navigation";

export default async function LegacySupervisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/advisor/students/${id}/supervision`);
}
