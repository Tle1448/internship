"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentStudentId } from "@/lib/currentUser";

// ---------- Icon ----------
function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

// ---------- Types ----------
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  application_id: string | null;
  job_application_id: string | null;
  supervision_appointment_id: string | null;
}

interface NotificationBellProps {
  role: "student" | "coordinator" | "advisor";
}

function notificationHref(item: NotificationItem, role: NotificationBellProps["role"]) {
  if (item.supervision_appointment_id) return "/supervision-appointments";
  if (role === "advisor") return "/advisor/students";
  if (role === "coordinator") {
    const placementNotice = item.title.includes("สถานที่ฝึกงาน") || item.title.includes("หลักฐาน") || item.title.includes("ยืนยัน");
    return placementNotice ? "/conditer/placements" : "/conditer/applications";
  }
  if (item.application_id || item.job_application_id) return "/select-company";
  return "/notifications";
}

// ---------- Component ----------
export default function NotificationBell({ role }: NotificationBellProps) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((n) => !n.is_read).length;

  // ---------------------------------------------------------------------
  // โหลดรายการแจ้งเตือน ตาม role ปัจจุบัน
  // ---------------------------------------------------------------------
  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      if (role === "coordinator" || role === "advisor") {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_type", role)
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) throw error;
        setItems(data || []);
      } else {
        const studentId = await getCurrentStudentId();

        if (!studentId) {
          setItems([]);
          return;
        }

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_type", "student")
          .eq("recipient_id", studentId)
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) throw error;
        setItems(data || []);
      }
    } catch (err) {
      console.error("โหลดการแจ้งเตือนไม่สำเร็จ:", err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  // โหลดครั้งแรก + poll ทุก 30 วินาที เพื่อความสด (ยังไม่ใช้ Supabase Realtime)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("อัปเดตสถานะอ่านแล้วไม่สำเร็จ:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("อัปเดตสถานะอ่านทั้งหมดไม่สำเร็จ:", error);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) await handleMarkAsRead(item.id);
    setIsOpen(false);
    router.push(notificationHref(item, role));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={handleToggle}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg ring-1 ring-black/5 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
            <p className="text-sm font-bold text-slate-900">การแจ้งเตือน</p>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-medium text-indigo-700 hover:underline cursor-pointer"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {loading && items.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center">
              กำลังโหลด...
            </p>
          ) : items.length === 0 ? (
            <p className="p-6 text-xs text-slate-400 text-center">
              ยังไม่มีการแจ้งเตือน
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void handleNotificationClick(n)}
                    className={`w-full px-4 py-3 text-left text-xs cursor-pointer transition hover:bg-slate-50 ${!n.is_read ? "bg-indigo-50/40" : "bg-white"}`}
                  >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`font-semibold ${
                        !n.is_read ? "text-slate-900" : "text-slate-600"
                      }`}
                    >
                      {n.title}
                    </p>

                    {!n.is_read && (
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-slate-500 mt-0.5">{n.message}</p>

                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleString("th-TH")}
                  </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
