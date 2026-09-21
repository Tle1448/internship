import AdvisorShell from "../components/AdvisorShell";
import StudentProgressList from "../components/StudentProgressList";

export default function AdvisorStudentsPage() {
  return <AdvisorShell active="students" title="นักศึกษาในความดูแล"><StudentProgressList /></AdvisorShell>;
}
