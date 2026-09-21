import AdvisorStudentRoute from "../../components/AdvisorStudentRoute";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdvisorStudentRoute id={id} view="overview" />;
}
