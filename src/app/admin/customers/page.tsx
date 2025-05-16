"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, Eye, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { khachHangService, ThamSoPhanTrangKhachHangDTO } from "@/services/khach-hang.service";
import { KhachHangAdminDTO, ThemKhachHangMuaTaiQuayAdminDTO, SuaKhachHangAdminDTO } from "@/types/khach-hang";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<KhachHangAdminDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<KhachHangAdminDTO | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<ThemKhachHangMuaTaiQuayAdminDTO>({
    ten_khach_hang: "",
    so_dien_thoai: "",
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Lấy danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const params: ThamSoPhanTrangKhachHangDTO = {
        trang_hien_tai: 1,
        so_phan_tu_tren_trang: 10,
        tong_so_trang: 1,
        tong_so_phan_tu: 10,
        tim_kiem: debouncedSearchTerm || undefined
      };
      const data = await khachHangService.getDanhSachKhachHang(params);
      setCustomers(data.danh_sach);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Không thể tải danh sách khách hàng";
      toast.error(errorMessage);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearchTerm]);

  // Xóa phần lọc khách hàng ở client vì đã xử lý ở server
  const filteredCustomers = customers;

  // Xử lý thêm khách hàng mới
  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.ten_khach_hang || !newCustomer.so_dien_thoai) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }

      await khachHangService.themKhachHangMuaTaiQuay(newCustomer);
      toast.success("Thêm khách hàng thành công");
      setIsAddDialogOpen(false);
      setNewCustomer({
        ten_khach_hang: "",
        so_dien_thoai: "",
      });
      fetchCustomers();
    } catch (error: any) {
      const errorMessage = error.response?.data || "Không thể thêm khách hàng";
      toast.error(errorMessage);
    }
  };

  // Xử lý chỉnh sửa khách hàng
  const handleEditCustomer = async () => {
    try {
      if (!selectedCustomer) return;

      const updateData: SuaKhachHangAdminDTO = {
        ten_khach_hang: selectedCustomer.ten_khach_hang || "",
        email: selectedCustomer.email || "",
        so_dien_thoai: selectedCustomer.so_dien_thoai || "",
      };

      await khachHangService.capNhatKhachHang(selectedCustomer.id_khach_hang, updateData);
      toast.success("Cập nhật khách hàng thành công");
      setIsEditDialogOpen(false);
      fetchCustomers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Không thể cập nhật khách hàng";
      toast.error(errorMessage);
    }
  };

  // Xử lý xóa khách hàng
  const handleDeleteCustomer = async (id: string) => {
    try {
      await khachHangService.xoaKhachHang(id);
      toast.success("Xóa khách hàng thành công");
      setIsDeleteDialogOpen(false);
      fetchCustomers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Không thể xóa khách hàng";
      toast.error(errorMessage);
    }
  };

  // Xử lý cập nhật trạng thái
  const handleUpdateStatus = async (id: string, newStatus: "HoatDong" | "KhongHoatDong") => {
    try {
      await khachHangService.capNhatTrangThaiKhachHang(id, { trang_thai: newStatus });
      toast.success("Cập nhật trạng thái thành công");
      fetchCustomers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Không thể cập nhật trạng thái";
      toast.error(errorMessage);
    }
  };

  // Xử lý xem chi tiết khách hàng
  const handleViewCustomer = async (customer: KhachHangAdminDTO) => {
    try {
      setSelectedCustomer(customer);
      setIsViewDialogOpen(true);
      
      // Gọi API lấy chi tiết khách hàng
      const chiTietKhachHang = await khachHangService.getChiTietKhachHang(customer.id_khach_hang);
      
      // Cập nhật state với dữ liệu chi tiết
      setSelectedCustomer(chiTietKhachHang);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Không thể lấy thông tin chi tiết khách hàng";
      toast.error(errorMessage);
      setIsViewDialogOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    searchInputRef.current?.focus();
  };

  // Tách riêng phần loading cho bảng
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-16">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (filteredCustomers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-slate-100 p-3">
                <Search className="h-6 w-6 text-slate-500" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-slate-900">
                  {searchTerm ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}
                </p>
                <p className="text-sm text-slate-500">
                  {searchTerm 
                    ? "Hãy thử tìm kiếm với từ khóa khác" 
                    : "Bắt đầu thêm khách hàng mới bằng cách nhấn nút 'Thêm khách hàng'"}
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredCustomers.map((customer, index) => (
      <TableRow key={customer.id_khach_hang}>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{customer.ma_khach_hang || "N/A"}</TableCell>
        <TableCell className="font-medium">{customer.ten_khach_hang || "Chưa cập nhật"}</TableCell>
        <TableCell>{customer.so_dien_thoai || "Chưa cập nhật"}</TableCell>
        <TableCell>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              customer.trang_thai === "HoatDong"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {customer.trang_thai === "HoatDong" ? "Hoạt động" : "Không hoạt động"}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <Button
            size="icon"
            variant="ghost"
            className="text-blue-500 hover:bg-blue-50"
            onClick={() => handleViewCustomer(customer)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-blue-500 hover:bg-blue-50"
            onClick={() => {
              setSelectedCustomer(customer);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-red-500 hover:bg-red-50"
            onClick={() => {
              setSelectedCustomer(customer);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý khách hàng</h1>
            <p className="text-slate-500">Quản lý thông tin khách hàng</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách khách hàng</CardTitle>
            <CardDescription>Quản lý thông tin khách hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  ref={searchInputRef}
                  className="pl-10 pr-10"
                  placeholder="Tìm kiếm khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label="Xóa tìm kiếm"
                    title="Xóa tìm kiếm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                onClick={() => {
                  setNewCustomer({
                    ten_khach_hang: "",
                    so_dien_thoai: "",
                  });
                  setIsAddDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm khách hàng</span>
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[80px]">STT</TableHead>
                    <TableHead>Mã KH</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableContent()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog thêm khách hàng */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Thêm khách hàng mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin khách hàng mới
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ tên <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  placeholder="Nhập họ tên khách hàng"
                  value={newCustomer.ten_khach_hang}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, ten_khach_hang: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  placeholder="Nhập số điện thoại"
                  value={newCustomer.so_dien_thoai}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, so_dien_thoai: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddCustomer}>Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog chỉnh sửa khách hàng */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin khách hàng
              </DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Họ tên <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-name"
                    placeholder="Nhập họ tên khách hàng"
                    value={selectedCustomer.ten_khach_hang}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        ten_khach_hang: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Số điện thoại <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-phone"
                    placeholder="Nhập số điện thoại"
                    value={selectedCustomer.so_dien_thoai}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        so_dien_thoai: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="status"
                        value="HoatDong"
                        checked={selectedCustomer.trang_thai === "HoatDong"}
                        onChange={(e) =>
                          setSelectedCustomer({
                            ...selectedCustomer,
                            trang_thai: e.target.value,
                          })
                        }
                        className="form-radio"
                      />
                      <span>Hoạt động</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="status"
                        value="KhongHoatDong"
                        checked={selectedCustomer.trang_thai === "KhongHoatDong"}
                        onChange={(e) =>
                          setSelectedCustomer({
                            ...selectedCustomer,
                            trang_thai: e.target.value,
                          })
                        }
                        className="form-radio"
                      />
                      <span>Không hoạt động</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleEditCustomer}>Cập nhật</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog xem chi tiết khách hàng */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Chi tiết khách hàng</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về khách hàng
              </DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Mã khách hàng</Label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm font-medium">
                      {selectedCustomer.ma_khach_hang || "N/A"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Họ tên</Label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm font-medium">
                      {selectedCustomer.ten_khach_hang || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Email</Label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm">
                      {selectedCustomer.email || "Chưa cập nhật"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Số điện thoại</Label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm">
                      {selectedCustomer.so_dien_thoai || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Ngày sinh</Label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm">
                      {selectedCustomer.ngay_sinh ? new Date(selectedCustomer.ngay_sinh).toLocaleDateString('vi-VN') : "Chưa cập nhật"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Giới tính</Label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm">
                      {selectedCustomer.gioi_tinh || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-500">Trạng thái</Label>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedCustomer.trang_thai === "HoatDong"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedCustomer.trang_thai === "HoatDong"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-4">Thông tin đơn hàng</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Tổng đơn hàng</Label>
                      <div className="p-3 bg-slate-50 rounded-lg text-sm">
                        {selectedCustomer.hoaDonDTOs?.length || 0} đơn hàng
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog xác nhận xóa */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedCustomer && handleDeleteCustomer(selectedCustomer.id_khach_hang)}
                className="bg-red-500 hover:bg-red-600"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
} 