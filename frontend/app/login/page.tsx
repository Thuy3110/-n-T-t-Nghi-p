"use client";

import { useState } from "react";
import { Eye, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await authService.login({
        username,
        password,
      });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Đăng nhập thành công");
      const role = String(res.data.user.role || "USER").trim().toUpperCase();
      router.push(
        ["ADMIN", "SUPER_ADMIN", "SUPER USER"].includes(role)
          ? "/dashboard"
          : role === "LECTURER"
            ? "/assessments/direct"
            : "/tasks",
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f8fc] flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[440px] bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#1f66ad] to-[#007a6c]" />

          <div className="px-10 py-10">
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/dau_logo.jpg"
                alt="DAU Logo"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-[13px] sm:text-sm font-bold text-[#881337] uppercase whitespace-nowrap leading-tight">
                  Trường Đại học Kiến trúc Đà Nẵng
                </h2>
                <p className="text-[9px] tracking-[0.15em] font-semibold text-slate-500 uppercase whitespace-nowrap mt-0.5">
                  DANANG UNIVERSITY OF ARCHITECTURE
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Đăng Nhập</h2>
            <div className="w-12 h-1 bg-[#1f66ad] rounded mt-3 mb-8" />

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Tên đăng nhập
                </label>
                <div className="mt-3 flex items-center bg-[#e8edf1] rounded-md px-4 h-14">
                  <User size={18} className="text-gray-500 mr-4" />
                  <input
                    type="text"
                    placeholder="Nhập tài khoản"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-transparent outline-none w-full text-gray-700 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Mật khẩu
                </label>
                <div className="mt-3 flex items-center bg-[#e8edf1] rounded-md px-4 h-14">
                  <Lock size={18} className="text-gray-500 mr-4" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent outline-none w-full text-gray-700 placeholder:text-gray-400"
                  />
                  <Eye size={18} className="text-gray-500" />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="w-5 h-5" />
                  Nhớ mật khẩu trên máy này
                </label>

                <Link href="/admin/reset-password" className="font-semibold text-[#1f66ad]">
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-md bg-[#246caf] text-white font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#1d5f9e]"
              >
                {loading ? "Đang đăng nhập..." : "Đăng Nhập"}{" "}
                <ArrowRight size={20} />
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-10">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-[#007a6c] font-bold">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="h-[90px] px-8 flex items-center justify-between text-xs text-slate-500 bg-[#eef5fa]">
        <div>
          <h3 className="font-bold text-sm text-[#881337] mb-1">TRƯỜNG ĐẠI HỌC KIẾN TRÚC ĐÀ NẴNG (DAU)</h3>
          <p>© 2024 DANANG UNIVERSITY OF ARCHITECTURE. ALL RIGHTS RESERVED.</p>
        </div>

        <div className="hidden md:flex gap-10 uppercase tracking-wide">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Contact Support</span>
        </div>
      </footer>
    </div>
  );
}
