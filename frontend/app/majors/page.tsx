"use client";

import { useEffect, useState } from "react";

import AdminLayout from "@/components/layout/AdminLayout";

import { Major } from "@/types/major.type";
import { getMajors } from "@/services/major.service";

export default function MajorsPage() {
  const [majors, setMajors] = useState<Major[]>([]);

  useEffect(() => {
    fetchMajors();
  }, []);

  const fetchMajors = async () => {
    try {
      const data = await getMajors();
      setMajors(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-bold text-slate-900">
              Quản lý ngành đào tạo
            </h1>

            <p className="mt-2 text-slate-500">
              Danh sách ngành đào tạo trong hệ thống
            </p>
          </div>

          <button className="h-12 px-6 rounded-xl bg-[#165aa7] text-white">
            Thêm ngành
          </button>
        </div>

        <div className="bg-white rounded-3xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Mã ngành</th>
                <th className="p-4 text-left">Tên ngành</th>
                <th className="p-4 text-left">Mô tả</th>
              </tr>
            </thead>

            <tbody>
              {majors.map((major) => (
                <tr
                  key={major.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="p-4">{major.code}</td>

                  <td className="p-4 font-medium">
                    {major.name}
                  </td>

                  <td className="p-4">
                    {major.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}