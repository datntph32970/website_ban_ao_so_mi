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

  // Temporary data - will be replaced with API calls
  const featuredProducts = [
    {
      id: 1,
      name: "Áo sơ mi nam trắng công sở",
      price: 450000,
      image: "/placeholder.png",
      category: "Formal"
    },
    {
      id: 2,
      name: "Áo sơ mi nam kẻ sọc",
      price: 550000,
      image: "/placeholder.png",
      category: "Business"
    },
    {
      id: 3,
      name: "Áo sơ mi nam casual",
      price: 399000,
      image: "/placeholder.png",
      category: "Casual"
    },
    // Add more products as needed
  ];

  const categories = [
    {
      id: 1,
      name: "Áo sơ mi công sở",
      image: "/placeholder.png",
      slug: "formal"
    },
    {
      id: 2,
      name: "Áo sơ mi casual",
      image: "/placeholder.png",
      slug: "casual"
    },
    {
      id: 3,
      name: "Áo sơ mi dự tiệc",
      image: "/placeholder.png",
      slug: "party"
    },
    // Add more categories as needed
  ];

  return null;
} 