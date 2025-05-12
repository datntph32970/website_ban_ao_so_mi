"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Search, Package, Clock, CheckCircle2, XCircle } from "lucide-react";

// TypeScript interfaces dựa trên DTO bạn cung cấp
interface SanPhamChiTiet_HoaDonChiTietAdminDTO {
  id_san_pham_chi_tiet: string;
  ma_san_pham_chi_tiet: string;
  ten_san_pham: string;
  ten_mau_sac: string;
  ten_kich_co: string;
}
interface NhanVien_HoaDonAdminDTO {
  id_nhan_vien: string;
  ma_nhan_vien: string;
  ten_nhan_vien: string;
}
interface KhachHang_HoaDonAdminDTO {
  id_khach_hang: string;
  ma_khach_hang: string;
  ten_khach_hang: string;
  sdt_khach_hang: string;
}
interface HoaDonChiTietAdminDTO {
  id_hoa_don_chi_tiet: string;
  ma_hoa_don_chi_tiet: string;
  id_hoa_don: string;
  id_san_pham_chi_tiet: string;
  so_luong: number;
  don_gia: number;
  gia_sau_giam_gia: number;
  gia_tri_khuyen_mai_cua_hoa_don_cho_hdct: number;
  thanh_tien: number;
  trang_thai: string;
  ghi_chu: string;
  ngay_sua?: string;
  ten_nguoi_sua: string;
  SanPhamChiTiet: SanPhamChiTiet_HoaDonChiTietAdminDTO;
  hoaDon: any;
  nhanVien: NhanVien_HoaDonAdminDTO;
}
interface HoaDonAdminDTO {
  id_hoa_don: string;
  ma_hoa_don: string;
  id_khach_hang?: string;
  ten_khach_hang: string;
  ten_nhan_vien: string;
  sdt_khach_hang?: string;
  dia_chi_nhan_hang?: string;
  ghi_chu?: string;
  loai_hoa_don: string;
  tong_tien_don_hang: number;
  gia_tri_khuyen_mai_cho_hoa_don?: number;
  gia_tri_khuyen_mai_toi_da_cho_hoa_don?: number;
  tong_tien_phai_thanh_toan: number;
  loai_khuyen_mai?: string;
  trang_thai: string;
  phuong_thuc_thanh_toan: string;
  ngay_tao: string;
  ten_nguoi_tao: string;
  ngay_sua?: string;
  ten_nguoi_sua?: string;
  nguoiTao: NhanVien_HoaDonAdminDTO;
  nguoiSua: NhanVien_HoaDonAdminDTO;
  khachHang: KhachHang_HoaDonAdminDTO;
  HoaDonChiTiets: HoaDonChiTietAdminDTO[];
}

// Trạng thái đơn hàng
const orderStatus = {
  processing: {
    label: "Đang xử lý",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-4 w-4 mr-1" />
  },
  shipping: {
    label: "Đang giao hàng",
    color: "bg-blue-100 text-blue-800",
    icon: <Package className="h-4 w-4 mr-1" />
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle2 className="h-4 w-4 mr-1" />
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-4 w-4 mr-1" />
  }
};

export default function OrderListPage() {
  const [orders, setOrders] = useState<HoaDonAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[0] | null>(null);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);

  useEffect(() => {
    // Giả lập fetch API, bạn thay bằng service thực tế
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang tải hóa đơn...</div>;

  // Lọc đơn hàng theo từ khóa tìm kiếm
  const filteredOrders = orders.filter(order =>
    order.ma_hoa_don.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.khachHang?.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.sdt_khach_hang?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewOrder = (order: typeof orders[0]) => {
    setSelectedOrder(order);
    setIsViewOrderOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý đơn hàng</h1>
          <p className="text-slate-500">Xem và quản lý đơn hàng của cửa hàng</p>
        </div>
      </div>

      <div className="mb-6 flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            className="pl-10"
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">Lọc theo trạng thái</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                  Không tìm thấy đơn hàng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id_hoa_don}>
                  <TableCell className="font-medium">{order.ma_hoa_don}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.khachHang?.ten_khach_hang}</p>
                      <p className="text-xs text-slate-500">{order.sdt_khach_hang}</p>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(order.ngay_tao).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-right font-medium">
                    {order.tong_tien_phai_thanh_toan.toLocaleString()}₫
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center w-fit mx-auto ${orderStatus[order.trang_thai as keyof typeof orderStatus].color}`}>
                      {orderStatus[order.trang_thai as keyof typeof orderStatus].icon}
                      {orderStatus[order.trang_thai as keyof typeof orderStatus].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex items-center gap-1"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Xem</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        {selectedOrder && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Chi tiết đơn hàng #{selectedOrder.ma_hoa_don}</DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Thông tin khách hàng</h3>
                  <p className="font-medium">{selectedOrder.khachHang?.ten_khach_hang}</p>
                  <p className="text-sm">{selectedOrder.sdt_khach_hang}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Thông tin đơn hàng</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">Trạng thái:</p>
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center ${orderStatus[selectedOrder.trang_thai as keyof typeof orderStatus].color}`}>
                      {orderStatus[selectedOrder.trang_thai as keyof typeof orderStatus].icon}
                      {orderStatus[selectedOrder.trang_thai as keyof typeof orderStatus].label}
                    </span>
                  </div>
                  <p className="text-sm">Ngày đặt: {new Date(selectedOrder.ngay_tao).toLocaleString("vi-VN")}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Sản phẩm đặt mua</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.HoaDonChiTiets.map((ct) => (
                        <TableRow key={ct.id_hoa_don_chi_tiet}>
                          <TableCell>{ct.SanPhamChiTiet.ten_san_pham}</TableCell>
                          <TableCell className="text-right">{ct.don_gia.toLocaleString()}₫</TableCell>
                          <TableCell className="text-center">{ct.so_luong}</TableCell>
                          <TableCell className="text-right font-medium">
                            {(ct.don_gia * ct.so_luong).toLocaleString()}₫
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between border-t pt-4">
                <span className="font-medium">Tổng cộng</span>
                <span className="font-bold text-xl">{selectedOrder.tong_tien_phai_thanh_toan.toLocaleString()}₫</span>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                {selectedOrder.trang_thai === "processing" && (
                  <Button variant="outline" className="gap-1">
                    <Package className="h-4 w-4" />
                    <span>Xác nhận giao hàng</span>
                  </Button>
                )}
                {selectedOrder.trang_thai === "shipping" && (
                  <Button variant="outline" className="gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Xác nhận hoàn thành</span>
                  </Button>
                )}
                {(selectedOrder.trang_thai === "processing" || selectedOrder.trang_thai === "shipping") && (
                  <Button variant="destructive" className="gap-1">
                    <XCircle className="h-4 w-4" />
                    <span>Hủy đơn hàng</span>
                  </Button>
                )}
                <Button onClick={() => setIsViewOrderOpen(false)}>Đóng</Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}
