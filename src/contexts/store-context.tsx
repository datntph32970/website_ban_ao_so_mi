"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { cuaHangService } from "@/services/cua-hang.service";
import { toast } from "react-hot-toast";

interface StoreInfo {
  id_cua_hang: string;
  ten_cua_hang: string;
  email: string;
  sdt: string;
  dia_chi: string;
  website: string;
  hinh_anh_url: string | null;
  mo_ta: string;
}

interface StoreContextType {
  storeInfo: StoreInfo | null;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const data = await cuaHangService.getThongTinCuaHang();
        setStoreInfo(data);
      } catch (error) {
        console.error("Error fetching store info:", error);
        toast.error("Không thể tải thông tin cửa hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, []);

  return (
    <StoreContext.Provider value={{ storeInfo, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
} 