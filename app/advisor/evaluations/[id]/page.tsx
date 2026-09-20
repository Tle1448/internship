import { notFound } from "next/navigation";
import { students } from "../../data";
import EvaluationForm from "../../components/EvaluationForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = students.find(s => s.id === id);
  if (!student) notFound();
  return <EvaluationForm key={student.id} student={student}/>;
}
