"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-[#f5f8fc]">
      <Sidebar />

      <div style={{ marginLeft: "270px", minHeight: "100vh" }}>
        <Header />

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}