"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  user: { id: string; name: string; email: string };
  onCancel: () => void;
  onConfirm: () => void;
};

export default function AdminDeleteConfirmationModal({ user, onCancel, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    cancelRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-0 bg-white p-6 text-black shadow-2xl backdrop:bg-black/40 sm:p-8"
    >
      <div className="mb-5 flex items-center justify-between">
        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-orange-50 text-[#F35B04]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></svg>
        </span>
        <button type="button" onClick={onCancel} aria-label="ปิดหน้าต่าง" className="cursor-pointer rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100">×</button>
      </div>
      <h2 id={titleId} className="text-xl font-bold">ยืนยันการลบผู้ใช้งาน</h2>
      <p id={descriptionId} className="mt-3 leading-relaxed text-gray-600">คุณต้องการลบผู้ใช้ <strong className="text-black">{user.name}</strong> จริง ๆ หรือไม่?</p>
      <p className="mt-2 text-sm text-gray-500">ผู้ใช้จะถูกย้ายไปยังรายการด้านล่าง และสามารถกู้คืนได้ภายหลัง</p>
      <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        <p className="break-all">รหัสผู้ใช้: {user.id}</p>
        <p className="mt-1 break-all">{user.email}</p>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button ref={cancelRef} type="button" onClick={onCancel} className="cursor-pointer rounded-lg border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D348B]">ยกเลิก</button>
        <button type="button" onClick={onConfirm} className="cursor-pointer rounded-lg bg-[#F35B04] px-5 py-3 font-semibold text-white hover:bg-[#D94F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F35B04]">ยืนยันการลบ</button>
      </div>
    </dialog>
  );
}
