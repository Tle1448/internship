import { notFound } from "next/navigation";
import { students } from "../../data";
import StudentProgress from "../../components/StudentProgress";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = students.find(s => s.id === id);
  if (!student) notFound();
  return <StudentProgress key={student.id} student={student}/>;
}
