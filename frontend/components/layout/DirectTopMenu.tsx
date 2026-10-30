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
    title: "Thoát",
    href: "/dashboard",
  },
];

export default function DirectTopMenu() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-8">
      {menus.map((item) => {
        const active =
          pathname === item.href ||
          ((item.href === "/assessments/direct/matrix" ||
            item.href === "/assessments/direct/analysis") &&
            pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              h-[72px]
              flex items-center
              text-[15px]
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