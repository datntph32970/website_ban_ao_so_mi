"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface AdminLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean; // Thêm tùy chọn bỏ qua padding
}

export function AdminLayout({ children, noPadding = false }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />
      <main className="pt-16 pl-64 min-h-screen">
        {noPadding ? children : (
          <div className="p-6">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
