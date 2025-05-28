"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function CustomerHomePage() {
  useEffect(() => {
    redirect("/");
  }, []);
  return null;
} 