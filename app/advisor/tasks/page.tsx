import AdvisorShell from "../components/AdvisorShell";
import EvaluationList from "../components/EvaluationList";

export default function AdvisorTasksPage() {
  return <AdvisorShell active="tasks" title="งานที่ต้องดำเนินการ"><EvaluationList /></AdvisorShell>;
}
