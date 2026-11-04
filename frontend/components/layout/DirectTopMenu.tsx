"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  {
    title: "Bảng điều khiển",
    href: "/assessments/direct",
  },
  {
    title: "Nhập điểm từ excel",
    href: "/assessments/direct/import",
  },
  {
    title: "QL ma trận",
    href: "/assessments/direct/matrix",
  },
  {
    title: "Thực hiện phân tích dữ liệu",
    href: "/assessments/direct/analysis",
  },
  {
    title: "Đánh giá của giảng viên",
    href: "/assessments/direct/lecturer",
  },
  {
    title: "Thoát",
    href: "/dashboard",
  },
];

export default function DirectTopMenu() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 xl:gap-5">
      {menus.map((item) => {
        const active =
          pathname === item.href ||
          ((item.href === "/assessments/direct/matrix" ||
            item.href === "/assessments/direct/analysis" ||
            item.href === "/assessments/direct/lecturer") &&
            pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              h-[72px]
              flex items-center
              whitespace-nowrap text-xs xl:text-sm
              transition-colors
              ${
                active
                  ? "text-[#165aa7] font-semibold border-b-2 border-[#165aa7]"
                  : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            {item.title}
          </Link>
        );
      })}
    </div>
  );
}