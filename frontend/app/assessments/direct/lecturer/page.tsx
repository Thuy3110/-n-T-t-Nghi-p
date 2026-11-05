"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyLecturerAssessmentRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/lecturer");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
      Đang chuyển hướng sang Trang riêng của Giảng viên...
    </div>
  );
}
