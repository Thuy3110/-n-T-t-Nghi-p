"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  {
    title: "Bảng điều khiển",
    href: "/assessments/indirect",
  },
  {
    title: "Quản lý ma trận",
    href: "/assessments/indirect/matrix",
  },
  {
    title: "Thông số đánh giá",
    href: "/assessments/indirect/config",
  },
  {
    title: "Phân tích - Đánh giá",
    href: "/assessments/indirect/analysis",
  },
];

export default function IndirectTopMenu() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-8">
      {menus.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/assessments/indirect" &&
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