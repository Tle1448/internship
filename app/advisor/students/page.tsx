import AdvisorShell from "../components/AdvisorShell";
import StudentProgressList from "../components/StudentProgressList";

export default function AdvisorStudentsPage() {
  return <AdvisorShell active="progress" title="ความก้าวหน้านักศึกษา"><StudentProgressList /></AdvisorShell>;
}
