"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { homeForRole } from "@/lib/auth/types";

/* ------------------------------------------------------------------ */
/*  Login page                                                        */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [userCode, setUserCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUserCode = userCode.trim().toUpperCase();
    const cleanPassword = password;

    if (!cleanUserCode || !cleanPassword) {
      setError("กรุณากรอกบัญชีผู้ใช้งานและรหัสผ่านให้ครบถ้วน");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const user = await login(cleanUserCode, cleanPassword, remember);
      router.replace(homeForRole(user.role));
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      {/* ส่วนเนื้อหาหลัก: พื้นหลังเต็มจอ + การ์ด Login อยู่กึ่งกลาง */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* background image เต็มพื้นที่ */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/login-bg.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-[480px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 p-8 mx-6 my-10">

          {/* Header Icon & Title */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#3D348B]/10 text-[#3D348B] rounded-xl flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              เข้าสู่ระบบ (Sign In)
            </h1>

            <p className="text-sm text-gray-500">
              กรุณากรอกบัญชีผู้ใช้งานเพื่อเข้าสู่ระบบ WU-InternShip
            </p>
          </div>

          {/* แสดงข้อความ Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* User code input */}
            <div className="space-y-2">
              <label
                htmlFor="user-code"
                className="block text-sm font-semibold text-gray-700"
              >
                รหัสผู้ใช้งาน (User ID){" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>

                <input
                  type="text"
                  id="user-code"
                  value={userCode}
                  inputMode="text"
                  autoComplete="username"
                  maxLength={9}
                  onChange={(e) => {
                    setUserCode(e.target.value);
                    if (error) setError("");
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-[#7678ED] focus:border-[#7678ED] sm:text-sm transition-colors outline-none"
                  placeholder="เช่น 64102105, ADV0001, ADM0001"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  รหัสผ่าน (Password){" "}
                  <span className="text-red-500">*</span>
                </label>

                <a
                  href="#"
                  className="text-sm font-medium text-[#7678ED] hover:text-[#3D348B] transition-colors"
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-[#7678ED] focus:border-[#7678ED] sm:text-sm transition-colors outline-none"
                  placeholder="••••••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.41-3.41"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center pt-1 pb-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 text-[#3D348B] focus:ring-[#7678ED] border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-600 cursor-pointer"
              >
                จดจำการเข้าสู่ระบบ
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-[10px] shadow-sm text-[15px] font-semibold text-white bg-[#3D348B] hover:bg-[#7678ED] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7678ED] transition-all active:scale-[0.98]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Sign In)"}
            </button>
          </form>

        </div>
      </div>

      {/*Footer พาดขยาวตลอดแนวเต็มหน้าจอด้านล่างสุด */}
      <div className="py-4 bg-gray-900 text-gray-400 text-center text-xs w-full">
        <p>© 2026 WU-InternShip Platform. ระบบบริหารจัดการสหกิจศึกษา มหาวิทยาลัยวลัยลักษณ์</p>
      </div>
    </div>
  );
}