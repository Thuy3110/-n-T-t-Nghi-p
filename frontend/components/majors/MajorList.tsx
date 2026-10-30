"use client";

import { useEffect, useState } from "react";
import { getMajors } from "@/services/major.service";
import { Major } from "@/types/major.type";

export default function MajorList() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMajors();
  }, []);

  const fetchMajors = async () => {
    try {
      const data = await getMajors();
      setMajors(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Ngành đào tạo
          </h1>

          <p className="text-slate-500 mt-2">
            Danh sách ngành đào tạo trong hệ thống
          </p>
        </div>

        <button className="h-12 px-5 rounded-xl bg-[#165aa7] text-white">
          Thêm ngành
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {majors.map((major) => (
          <div
            key={major.id}
            className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition"
          >
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-slate-400">
                  {major.code}
                </div>

                <h3 className="text-xl font-semibold mt-1">
                  {major.name}
                </h3>

                <p className="text-slate-500 mt-2">
                  {major.description}
                </p>
              </div>

              <div className="flex gap-2">
                <button className="px-4 h-10 border rounded-xl">
                  Sửa
                </button>

                <button className="px-4 h-10 border border-red-300 text-red-500 rounded-xl">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}