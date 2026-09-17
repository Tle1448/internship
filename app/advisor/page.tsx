import type { Metadata } from "next";
import AdvisorDashboard from "./components/AdvisorDashboard";
export const metadata: Metadata = { title: "แดชบอร์ดอาจารย์นิเทศ | WU Internship", description: "ภาพรวมการดูแลนักศึกษาสหกิจศึกษา" };
export default function AdvisorPage() { return <AdvisorDashboard />; }
