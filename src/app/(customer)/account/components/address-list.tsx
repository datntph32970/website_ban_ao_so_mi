"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { DiaChiDTO } from "@/types/khach-hang";
import { khachHangService } from "@/services/khach-hang.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Star, StarOff } from "lucide-react";
import AddAddressDialog from "./add-address-dialog";
import EditAddressDialog from "./edit-address-dialog";

export default function AddressList() {
  const [addresses, setAddresses] = useState<DiaChiDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await khachHangService.getMyAddresses();
      setAddresses(response.addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error("Không thể tải danh sách địa chỉ");
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsLoading(true);
    try {
      await khachHangService.setDefaultAddress(id);
      await fetchAddresses();
      toast.success("Đã đặt làm địa chỉ mặc định");
    } catch (error) {
      toast.error("Không thể đặt địa chỉ mặc định");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await khachHangService.deleteAddress(id);
      await fetchAddresses();
      toast.success("Đã xóa địa chỉ");
    } catch (error) {
      toast.error("Không thể xóa địa chỉ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sổ địa chỉ</CardTitle>
        <AddAddressDialog onSuccess={fetchAddresses} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!addresses || addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p>Bạn chưa có địa chỉ nào</p>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id_dia_chi}
                className="border rounded-lg p-4 relative group hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{address.ten_nguoi_nhan}</p>
                      {address.dia_chi_mac_dinh && (
                        <span className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {address.so_dien_thoai}
                    </p>
                    <p className="text-sm mt-2">
                      {address.dia_chi_cu_the}, {address.xa}, {address.huyen}, {address.tinh}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!address.dia_chi_mac_dinh && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetDefault(address.id_dia_chi)}
                        disabled={isLoading}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <EditAddressDialog address={address} onSuccess={fetchAddresses} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(address.id_dia_chi)}
                      disabled={isLoading || address.dia_chi_mac_dinh}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 