"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { title: "Home", href: "/dashboard" },
  { title: "Dashboard", href: "/surveys/dashboard" },
  { title: "QL Phiếu KS", href: "/surveys/forms" },
  { title: "Cài đặt KS", href: "/surveys/settings" },
  { title: "Thống kê - BC", href: "/surveys/reports" },
];

export default function SurveyTopMenu() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng quản lý khảo sát"
      className="flex h-[72px] min-w-0 items-center gap-3 overflow-x-auto sm:gap-5 xl:gap-7"
    >
      {menus.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-full shrink-0 items-center border-b-2 text-xs transition-colors sm:text-sm ${
              active
                ? "border-[#07866d] font-semibold text-[#07866d]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
