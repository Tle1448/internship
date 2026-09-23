"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  Clock,
  Eye,
  MapPin,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

type Application = {
  id: string;
  studentName: string;
  studentId: string;
  faculty: string;
  major: string;
  company: string;
  position: string;
  location: string;
  submittedDate: string;
  startDate: string;
  endDate: string;
  status: ApplicationStatus;
  email: string;
  phone: string;
  reason: string;
};

const statusConfig = {
  pending: {
    label: "รออนุมัติ",
    className: "bg-[#FFF6DD] text-[#D99500]",
  },
  approved: {
    label: "อนุมัติแล้ว",
    className: "bg-[#E8F8EF] text-[#159447]",
  },
  rejected: {
    label: "ไม่อนุมัติ",
    className: "bg-[#FDECEC] text-[#E94B4B]",
  },
};

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "all" | ApplicationStatus
  >("all");

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setPageError("");

    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        company_name,
        job_title,
        status,
        reason,
        submitted_at,
        student:profiles!job_applications_student_id_fkey(
          full_name,
          user_code,
          faculty,
          major,
          email,
          phone
        ),
        job:jobs!job_applications_job_id_fkey(
          location,
          start_date,
          end_date
        )
      `)
      .in("status", ["pending", "approved", "rejected"])
      .order("submitted_at", { ascending: false });

    if (error) {
      setApplications([]);
      setPageError(`โหลดรายการสมัครไม่สำเร็จ: ${error.message}`);
      setLoading(false);
      return;
    }

    const mapped = (data ?? []).map((row) => {
      const student = firstRelation(row.student);
      const job = firstRelation(row.job);

      return {
        id: row.id,
        studentName: student?.full_name ?? "ไม่ระบุชื่อ",
        studentId: student?.user_code ?? "-",
        faculty: student?.faculty ?? "-",
        major: student?.major ?? "-",
        company: row.company_name,
        position: row.job_title,
        location: job?.location ?? "-",
        submittedDate: formatDate(row.submitted_at),
        startDate: formatDate(job?.start_date),
        endDate: formatDate(job?.end_date),
        status: row.status as ApplicationStatus,
        email: student?.email ?? "-",
        phone: student?.phone ?? "-",
        reason: row.reason ?? "ไม่มีหมายเหตุ",
      } satisfies Application;
    });

    setApplications(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchApplications(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchApplications]);

  const filteredApplications = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return applications.filter((application) => {
      const matchesSearch =
        !keyword ||
        application.studentName
          .toLowerCase()
          .includes(keyword) ||
        application.studentId
          .toLowerCase()
          .includes(keyword) ||
        application.company
          .toLowerCase()
          .includes(keyword) ||
        application.position
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const pendingCount = applications.filter(
    (item) => item.status === "pending"
  ).length;

  const approvedCount = applications.filter(
    (item) => item.status === "approved"
  ).length;

  const rejectedCount = applications.filter(
    (item) => item.status === "rejected"
  ).length;

  const updateApplicationStatus = async (id: string, status: ApplicationStatus) => {
    if (!user) {
      setPageError("กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setUpdatingId(id);
    setPageError("");

    const { error } = await supabase
      .from("job_applications")
      .update({
        status,
        reviewed_by: status === "pending" ? null : user.id,
        reviewed_at: status === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setPageError(`บันทึกผลการพิจารณาไม่สำเร็จ: ${error.message}`);
      setUpdatingId(null);
      return;
    }

    setApplications((current) =>
      current.map((application) =>
        application.id === id
          ? {
              ...application,
              status,
            }
          : application
      )
    );

    setSelectedApplication((current) =>
      current?.id === id
        ? {
            ...current,
            status,
          }
        : current
    );
    setUpdatingId(null);
  };

  const approveApplication = (id: string) => void updateApplicationStatus(id, "approved");
  const rejectApplication = (id: string) => void updateApplicationStatus(id, "rejected");
  const cancelDecision = (id: string) => void updateApplicationStatus(id, "pending");

  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <ConditerSidebar />

      <main className="lg:ml-[235px]">
        <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
          <div className="mb-5">
            <h1 className="text-[22px] font-bold text-[#29263E]">
              การสมัครงาน
            </h1>

            <p className="mt-1 text-sm text-[#918D9F]">
              ตรวจสอบและพิจารณาสถานที่ฝึกงานที่นักศึกษาเลือก
            </p>
          </div>

          {pageError && (
            <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </p>
          )}

          {/* Stats */}
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatusCard
              title="รออนุมัติ"
              value={pendingCount}
              icon={<Clock size={21} />}
              className="bg-[#FFF6DD] text-[#D99500]"
              active={statusFilter === "pending"}
              onClick={() =>
                setStatusFilter("pending")
              }
            />

            <StatusCard
              title="อนุมัติแล้ว"
              value={approvedCount}
              icon={<Check size={21} />}
              className="bg-[#E8F8EF] text-[#159447]"
              active={statusFilter === "approved"}
              onClick={() =>
                setStatusFilter("approved")
              }
            />

            <StatusCard
              title="ไม่อนุมัติ"
              value={rejectedCount}
              icon={<X size={21} />}
              className="bg-[#FDECEC] text-[#E94B4B]"
              active={statusFilter === "rejected"}
              onClick={() =>
                setStatusFilter("rejected")
              }
            />
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-[#E7E4EF] bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-[#ECE9F1] px-6 py-5 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-bold text-[#302C44]">
                  รายการสมัครงาน
                </h2>

                <p className="mt-1 text-xs text-[#9691A5]">
                  อนุมัติ ไม่อนุมัติ หรือยกเลิกผลการพิจารณา
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A29EAE]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="ค้นหานักศึกษา บริษัท..."
                    className="h-11 w-full rounded-xl border border-[#E0DDE8] pl-11 pr-4 text-sm outline-none focus:border-[#7678ED] sm:w-[300px]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "all"
                        | ApplicationStatus
                    )
                  }
                  className="h-11 rounded-xl border border-[#E0DDE8] bg-white px-4 text-sm outline-none focus:border-[#7678ED]"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="pending">
                    รออนุมัติ
                  </option>
                  <option value="approved">
                    อนุมัติแล้ว
                  </option>
                  <option value="rejected">
                    ไม่อนุมัติ
                  </option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead>
                  <tr className="border-b border-[#ECE9F1] bg-[#FBFAFD]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#777287]">
                      นักศึกษา
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#777287]">
                      บริษัท / ตำแหน่ง
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#777287]">
                      สถานที่
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#777287]">
                      วันที่สมัคร
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#777287]">
                      สถานะ
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#777287]">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#89859A]">
                        กำลังโหลดรายการสมัคร...
                      </td>
                    </tr>
                  )}
                  {filteredApplications.map(
                    (application) => {
                      const status =
                        statusConfig[
                          application.status
                        ];

                      return (
                        <tr
                          key={application.id}
                          className="border-b border-[#F0EDF4] hover:bg-[#FCFBFE]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0EEFC] text-sm font-bold text-[#5149A0]">
                                {application.studentName.charAt(
                                  2
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-bold text-[#302C44]">
                                  {
                                    application.studentName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-[#89859A]">
                                  {
                                    application.studentId
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <p className="text-sm font-bold text-[#302C44]">
                              {application.company}
                            </p>

                            <p className="mt-1 text-xs text-[#777287]">
                              {application.position}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-xs text-[#777287]">
                              <MapPin size={16} />
                              {application.location}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-xs text-[#777287]">
                              <CalendarDays size={16} />
                              {
                                application.submittedDate
                              }
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-2">
                              {application.status ===
                                "pending" && (
                                <>
                                  <button
                                    disabled={updatingId === application.id}
                                    onClick={() =>
                                      approveApplication(
                                        application.id
                                      )
                                    }
                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-[#E8F8EF] px-3 text-xs font-semibold text-[#159447] hover:bg-[#D9F3E5] disabled:cursor-wait disabled:opacity-50"
                                  >
                                    <Check size={15} />
                                    อนุมัติ
                                  </button>

                                  <button
                                    disabled={updatingId === application.id}
                                    onClick={() =>
                                      rejectApplication(
                                        application.id
                                      )
                                    }
                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-[#FDECEC] px-3 text-xs font-semibold text-[#E94B4B] hover:bg-[#FBE0E0] disabled:cursor-wait disabled:opacity-50"
                                  >
                                    <X size={15} />
                                    ไม่อนุมัติ
                                  </button>
                                </>
                              )}

                              {application.status !==
                                "pending" && (
                                <button
                                  disabled={updatingId === application.id}
                                  onClick={() =>
                                    cancelDecision(
                                      application.id
                                    )
                                  }
                                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#DDD9E8] bg-white px-3 text-xs font-semibold text-[#6B667B] hover:border-[#7678ED] hover:bg-[#F4F3FC] hover:text-[#3D348B] disabled:cursor-wait disabled:opacity-50"
                                >
                                  <RotateCcw size={15} />
                                  ยกเลิก
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  setSelectedApplication(
                                    application
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E0DDE8] text-[#777287] hover:border-[#7678ED] hover:bg-[#F4F3FC]"
                              >
                                <Eye size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[#ECE9F1] px-6 py-4">
              <p className="text-xs text-[#9894A6]">
                แสดง {filteredApplications.length} จาก{" "}
                {applications.length} รายการ
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b border-[#ECE9F1] px-6 py-5">
              <div>
                <h2 className="font-bold text-[#29263E]">
                  รายละเอียดการสมัคร
                </h2>

                <p className="mt-1 text-xs text-[#9691A5]">
                  ตรวจสอบข้อมูลนักศึกษาและสถานที่ฝึกงาน
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedApplication(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F5F3FA]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <InfoBox
                title="ข้อมูลนักศึกษา"
                icon={<Users size={18} />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoItem
                    label="ชื่อ"
                    value={
                      selectedApplication.studentName
                    }
                  />

                  <InfoItem
                    label="รหัสนักศึกษา"
                    value={
                      selectedApplication.studentId
                    }
                  />

                  <InfoItem
                    label="สาขา"
                    value={
                      selectedApplication.major
                    }
                  />

                  <InfoItem
                    label="อีเมล"
                    value={
                      selectedApplication.email
                    }
                  />
                </div>
              </InfoBox>

              <InfoBox
                title="ข้อมูลบริษัท"
                icon={<Building2 size={18} />}
              >
                <div className="space-y-4">
                  <InfoItem
                    label="บริษัท"
                    value={
                      selectedApplication.company
                    }
                  />

                  <InfoItem
                    label="ตำแหน่ง"
                    value={
                      selectedApplication.position
                    }
                  />

                  <InfoItem
                    label="สถานที่"
                    value={
                      selectedApplication.location
                    }
                  />
                </div>
              </InfoBox>

              <InfoBox
                title="ระยะเวลาฝึกงาน"
                icon={<CalendarDays size={18} />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoItem
                    label="วันที่เริ่ม"
                    value={
                      selectedApplication.startDate
                    }
                  />

                  <InfoItem
                    label="วันที่สิ้นสุด"
                    value={
                      selectedApplication.endDate
                    }
                  />
                </div>
              </InfoBox>

              <div>
                <p className="mb-2 text-xs font-bold text-[#403C52]">
                  หมายเหตุการพิจารณา
                </p>

                <div className="rounded-xl bg-[#FAF9FC] p-4 text-sm leading-6 text-[#696579]">
                  {selectedApplication.reason}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-[#403C52]">
                  สถานะ
                </p>

                <span
                  className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold ${
                    statusConfig[
                      selectedApplication.status
                    ].className
                  }`}
                >
                  {
                    statusConfig[
                      selectedApplication.status
                    ].label
                  }
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#ECE9F1] bg-[#FCFBFD] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                onClick={() =>
                  setSelectedApplication(null)
                }
                className="rounded-xl border border-[#DDD9E8] bg-white px-5 py-3 text-sm font-semibold text-[#6B667B]"
              >
                ปิด
              </button>

              {selectedApplication.status ===
                "pending" && (
                <>
                  <button
                    disabled={updatingId === selectedApplication.id}
                    onClick={() =>
                      rejectApplication(
                        selectedApplication.id
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#E94B4B] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50"
                  >
                    <X size={17} />
                    ไม่อนุมัติ
                  </button>

                  <button
                    disabled={updatingId === selectedApplication.id}
                    onClick={() =>
                      approveApplication(
                        selectedApplication.id
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#159447] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50"
                  >
                    <Check size={17} />
                    อนุมัติ
                  </button>
                </>
              )}

              {selectedApplication.status !==
                "pending" && (
                <button
                  disabled={updatingId === selectedApplication.id}
                  onClick={() =>
                    cancelDecision(
                      selectedApplication.id
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#3D348B] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50"
                >
                  <RotateCcw size={17} />
                  ยกเลิกการพิจารณา
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  title,
  value,
  icon,
  className,
  active,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left transition hover:shadow-sm ${
        active
          ? "border-[#7678ED] shadow-sm"
          : "border-[#E7E4EF]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#9995A8]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#302C44]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${className}`}
        >
          {icon}
        </div>
      </div>
    </button>
  );
}

function InfoBox({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[#3D348B]">
        {icon}

        <h3 className="text-sm font-bold text-[#3A364B]">
          {title}
        </h3>
      </div>

      <div className="rounded-xl bg-[#FAF9FC] p-4">
        {children}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-[#AAA6B7]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[#403C52]">
        {value}
      </p>
    </div>
  );
}
