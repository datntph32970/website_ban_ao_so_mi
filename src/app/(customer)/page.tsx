"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function CustomerHomePage() {
  useEffect(() => {
    redirect("/");
  }, []);
  return null;
} 