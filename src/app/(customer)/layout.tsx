"use client";

import { CustomerLayout } from "@/components/layout/CustomerLayout";
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return <CustomerLayout>{children}</CustomerLayout>;
} 