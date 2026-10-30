"use client";

import { useState } from "react";
import { Eye, Home, LogIn, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      setLoading(true);

      await authService.register({
        fullName,
        phone,
        username,
        password,
      });

      alert("Đăng ký tài khoản thành công");
      router.push("/login");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f8fc] flex flex-col">
      <header className="h-[64px] bg-white flex items-center justify-between px-8">
        <h1 className="text-xl font-bold text-[#153f8f]">SDC Precision</h1>

        <nav className="hidden md:flex gap-10 text-sm text-slate-600">
          <span>Platform</span>
          <span>Curriculum</span>
          <span>Enterprise</span>
          <span>Support</span>
        </nav>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-slate-600">
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-[#1f66ad] text-white px-5 py-2 rounded-md"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[560px] bg-white rounded-md border border-gray-100 shadow-sm px-12 py-12">
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/dau_logo.jpg"
              alt="DAU Logo"
              className="w-12 h-12 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#881337] uppercase whitespace-nowrap leading-tight">
                Trường Đại học Kiến trúc Đà Nẵng
              </h2>
              <p className="text-[10px] tracking-[0.2em] font-semibold text-slate-500 uppercase whitespace-nowrap mt-0.5">
                DANANG UNIVERSITY OF ARCHITECTURE
              </p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-gray-600 mt-3 mb-10">
            Trường Đại học Kiến trúc Đà Nẵng
          </p>

          <form onSubmit={handleRegister} className="space-y-6">
            <Input
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={setFullName}
            />
            <Input
              label="Số điện thoại liên hệ"
              placeholder="090 123 4567"
              value={phone}
              onChange={setPhone}
            />
            <Input
              label="Tên đăng nhập"
              placeholder="username_precision"
              value={username}
              onChange={setUsername}
            />

            <div className="flex items-center gap-2 text-xs text-orange-700">
              <AlertTriangle size={14} />
              <span>
                Không tiếng Việt, không dấu cách, không ký tự đặc biệt như /
                hoặc ?
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordInput
                label="Mật khẩu đăng nhập"
                value={password}
                onChange={setPassword}
              />
              <PasswordInput
                label="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-md bg-[#2d8de0] text-white font-bold hover:bg-[#1f76c2]"
            >
              {loading ? "Đang tạo tài khoản..." : "Xác nhận Tạo tài khoản"}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="reset"
                className="h-12 rounded-md border border-gray-200 text-gray-600"
              >
                Xóa nhập
              </button>

              <Link
                href="/login"
                className="h-12 flex items-center justify-center gap-2 text-[#0d5d9c] font-bold"
              >
                <LogIn size={18} />
                Đăng nhập với Tài khoản đã có
              </Link>
            </div>
          </form>

          <div className="mt-12 pt-6 border-t flex items-center justify-between text-xs uppercase tracking-widest text-gray-500">
            <span>Quên mật khẩu?</span>
            <Link href="/" className="flex items-center gap-1">
              <Home size={14} /> Trang chủ
            </Link>
          </div>
        </div>
      </main>

      <footer className="h-[90px] px-8 flex items-center justify-between text-xs text-slate-500 uppercase tracking-wide">
        <p>© 2024 Software Development Center. All rights reserved.</p>
        <div className="hidden md:flex gap-10">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Security</span>
          <span>Compliance</span>
        </div>
      </footer>
    </div>
  );
}

function Input({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full h-14 rounded-md bg-[#e8edf1] px-4 outline-none text-gray-700 placeholder:text-gray-400"
      />
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-3 h-14 rounded-md bg-[#e8edf1] px-4 flex items-center">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none w-full"
        />
        <Eye size={18} className="text-gray-500" />
      </div>
    </div>
  );
}