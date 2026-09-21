import AdvisorStudentRoute from "../../../components/AdvisorStudentRoute";

export default async function EvaluationScoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdvisorStudentRoute id={id} view="evaluation" step="scores" />;
}
