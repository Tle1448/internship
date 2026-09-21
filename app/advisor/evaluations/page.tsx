import AdvisorShell from "../components/AdvisorShell";
import EvaluationList from "../components/EvaluationList";

export default function AdvisorEvaluationsPage() {
  return <AdvisorShell active="evaluation" title="บันทึกนิเทศและแบบประเมิน"><EvaluationList /></AdvisorShell>;
}
