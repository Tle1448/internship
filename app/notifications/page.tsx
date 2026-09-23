"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "student") {
      setLoading(false);
      return;
    }
    void loadNotifications(user.id);
  }, [user]);

  async function loadNotifications(studentId: string) {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("notifications")
      .select("id, title, message, is_read, created_at")
      .eq("recipient_type", "student")
      .eq("recipient_id", studentId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("ไม่สามารถโหลดการแจ้งเตือนได้");
    } else {
      setItems((data ?? []) as Notification[]);
    }
    setLoading(false);
  }

  async function markRead(id: string) {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!updateError) {
      setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    }
  }

  async function markAllRead() {
    const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id);
    if (unreadIds.length === 0) return;

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!updateError) {
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <StudentSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div><h1 className="text-xl font-bold text-slate-900">การแจ้งเตือน</h1><p className="mt-1 text-sm text-slate-500">ผลการพิจารณาใบสมัครและข้อมูลที่ต้องดำเนินการ</p></div>
            <button type="button" onClick={() => void markAllRead()} className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"><CheckCheck size={16} />อ่านทั้งหมด</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-700" /></div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center"><Bell className="mx-auto text-slate-400" size={32} /><p className="mt-3 text-sm text-slate-500">ยังไม่มีการแจ้งเตือน</p></div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {items.map((item) => (
                <button key={item.id} type="button" onClick={() => !item.is_read && void markRead(item.id)} className={"flex w-full items-start gap-4 border-b border-slate-100 p-5 text-left last:border-b-0 " + (!item.is_read ? "bg-indigo-50/40" : "bg-white")}>
                  <span className={"mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full " + (!item.is_read ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500")}><Bell size={16} /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-900">{item.title}</span>{!item.is_read && <span className="h-2 w-2 rounded-full bg-indigo-600" />}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{item.message}</span><span className="mt-2 block text-xs text-slate-400">{new Date(item.created_at).toLocaleString("th-TH")}</span></span>
                  {item.is_read && <Check size={16} className="mt-1 shrink-0 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
