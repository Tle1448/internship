"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";

type AdvisorProfileData = {
  full_name: string | null;
  user_code: string | null;
  email: string | null;
  phone: string | null;
  faculty: string | null;
  major: string | null;
};

type EditableProfile = {
  full_name: string;
  phone: string;
  faculty: string;
  major: string;
};

function display(value: string | null | undefined) {
  return value?.trim() || "ไม่ระบุ";
}

function toEditable(profile: AdvisorProfileData | null): EditableProfile {
  return {
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    faculty: profile?.faculty || "",
    major: profile?.major || "",
  };
}

export default function AdvisorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AdvisorProfileData | null>(null);
  const [draft, setDraft] = useState<EditableProfile>(toEditable(null));
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { void (async () => {
    if (!user || user.role !== "advisor") {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, user_code, email, phone, faculty, major")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      setMessage(`ไม่สามารถโหลดข้อมูลได้: ${error.message}`);
      setProfile(null);
    } else {
      const next = data as AdvisorProfileData | null;
      setProfile(next);
      setDraft(toEditable(next));
      setMessage("");
    }
    setLoading(false);
  })(); }, [user]);

  async function save() {
    if (!user || !draft.full_name.trim()) {
      setMessage("กรุณาระบุชื่อที่แสดง");
      return;
    }
    setSaving(true);
    const payload = {
      full_name: draft.full_name.trim(),
      phone: draft.phone.trim() || null,
      faculty: draft.faculty.trim() || null,
      major: draft.major.trim() || null,
    };
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select("full_name, user_code, email, phone, faculty, major")
      .single();
    setSaving(false);
    if (error) {
      setMessage(`บันทึกข้อมูลไม่สำเร็จ: ${error.message}`);
      return;
    }
    const next = data as AdvisorProfileData;
    setProfile(next);
    setDraft(toEditable(next));
    setEditing(false);
    setMessage("บันทึกข้อมูลส่วนตัวแล้ว");
  }

  function cancel() {
    setDraft(toEditable(profile));
    setEditing(false);
    setMessage("");
  }

  const name = profile?.full_name || user?.name || "อาจารย์ที่ปรึกษา";
  const code = profile?.user_code || user?.userCode || "-";

  return <AdvisorShell active="profile" title="โปรไฟล์อาจารย์">
    <section className="advisor-list-page advisor-profile-page" aria-labelledby="advisor-profile-title">
      <div className="list-heading"><div><h1 id="advisor-profile-title">โปรไฟล์อาจารย์</h1><p>ข้อมูลส่วนตัวสำหรับติดต่อและแสดงผลในระบบ</p></div>{!editing && <button className="button secondary" onClick={() => { setDraft(toEditable(profile)); setEditing(true); setMessage(""); }}><Icon name="file" />แก้ไขข้อมูล</button>}</div>
      {message && <p className="feedback">{message}</p>}
      <section className="detail-card advisor-profile-identity">
        <div className="advisor-profile-avatar" aria-hidden="true">{name.slice(0, 1)}</div>
        <div className="advisor-profile-name"><span>อาจารย์ที่ปรึกษา</span><h2>{loading ? "กำลังโหลด..." : name}</h2><p>{code}</p></div>
        <div className="advisor-profile-role"><span>บทบาทในระบบ</span><strong>Advisor</strong></div>
      </section>
      <section className="detail-card advisor-profile-details"><div className="section-title"><span className="detail-icon"><Icon name="users" /></span><div><h2>ข้อมูลติดต่อและสังกัด</h2><p>{editing ? "แก้ไขเฉพาะข้อมูลส่วนตัวที่ไม่กระทบสิทธิ์และการดำเนินงาน" : "ข้อมูลที่บันทึกไว้ในระบบ"}</p></div></div>{editing ? <form className="advisor-profile-form" onSubmit={(event) => { event.preventDefault(); void save(); }}><label>ชื่อที่แสดง<input required value={draft.full_name} onChange={(event) => setDraft({ ...draft, full_name: event.target.value })} /></label><label>โทรศัพท์<input inputMode="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label><label>คณะ / สำนักวิชา<input value={draft.faculty} onChange={(event) => setDraft({ ...draft, faculty: event.target.value })} /></label><label>สาขา / หลักสูตร<input value={draft.major} onChange={(event) => setDraft({ ...draft, major: event.target.value })} /></label><div className="advisor-profile-form-actions"><button className="button secondary" type="button" onClick={cancel}>ยกเลิก</button><button className="button primary" type="submit" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button></div></form> : <dl className="advisor-profile-grid"><div><dt>รหัสอาจารย์</dt><dd>{code}</dd></div><div><dt>อีเมลสำหรับล็อกอิน</dt><dd>{display(profile?.email)}</dd></div><div><dt>โทรศัพท์</dt><dd>{display(profile?.phone)}</dd></div><div><dt>คณะ / สำนักวิชา</dt><dd>{display(profile?.faculty)}</dd></div><div><dt>สาขา / หลักสูตร</dt><dd>{display(profile?.major)}</dd></div></dl>}</section>
    </section>
  </AdvisorShell>;
}
