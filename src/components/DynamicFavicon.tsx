"use client";
import { useEffect } from "react";
import { useStore } from "@/contexts/store-context";
import { getImageUrl } from "@/lib/utils";

export function DynamicFavicon() {
  const { storeInfo } = useStore();
  console.log('DynamicFavicon mounted');
  console.log('StoreInfo:', storeInfo);
  useEffect(() => {
    if (!storeInfo) return;
    const faviconUrl = storeInfo.hinh_anh_url ? getImageUrl(storeInfo.hinh_anh_url) : "/favicon.ico";
    console.log('Favicon URL:', faviconUrl);
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [storeInfo]);
  return null;
} 