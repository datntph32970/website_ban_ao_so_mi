"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import { phuongThucThanhToanService } from "@/services/phuong-thuc-thanh-toan.service";

interface PaymentMethod {
  id: string;
  ten_phuong_thuc_thanh_toan: string;
  ma_phuong_thuc_thanh_toan: string;
  mo_ta: string;
  trang_thai: boolean;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<Partial<PaymentMethod>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setIsLoading(true);
      const data = await phuongThucThanhToanService.getDanhSachPhuongThucThanhToan();
      const mapped = data.map((item: any) => ({
        ...item,
        id: item.id_phuong_thuc_thanh_toan
      }));
      setMethods(mapped);
    } catch (error) {
      toast.error("Không thể tải danh sách phương thức thanh toán");
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({});
    setIsDialogOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditing(method);
    setForm({ ...method });
    setIsDialogOpen(true);
  };

  const openDelete = (method: PaymentMethod) => {
    setDeleting(method);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.ten_phuong_thuc_thanh_toan) {
      toast.error("Vui lòng nhập tên phương thức thanh toán");
      return;
    }
    if (!editing && !form.ma_phuong_thuc_thanh_toan) {
      toast.error("Vui lòng nhập mã phương thức thanh toán");
      return;
    }
    if (!form.mo_ta) {
      toast.error("Vui lòng nhập mô tả");
      return;
    }
    try {
      if (editing) {
        const id = form.id || editing.id;
        if (!id) {
          toast.error("Không xác định được ID phương thức thanh toán");
          return;
        }
        const updateData = {
          ten_phuong_thuc_thanh_toan: form.ten_phuong_thuc_thanh_toan,
          mo_ta: form.mo_ta
        };
        await phuongThucThanhToanService.capNhatPhuongThucThanhToan(id, updateData);
        toast.success("Cập nhật thành công");
      } else {
        await phuongThucThanhToanService.themPhuongThucThanhToan(form as any);
        toast.success("Thêm mới thành công");
      }
      fetchMethods();
      setIsDialogOpen(false);
    } catch (error: any) {
      let errorMessage = "Có lỗi xảy ra";
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === 'object') {
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.errors) {
            errorMessage = Object.values(error.response.data.errors).flat().join(' ');
          } else {
            errorMessage = JSON.stringify(error.response.data);
          }
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(methods.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một phương thức thanh toán");
      return;
    }
    setDeleting({ id: selectedIds[0], ten_phuong_thuc_thanh_toan: `${selectedIds.length} phương thức thanh toán` } as PaymentMethod);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleting) {
      try {
        if (selectedIds.length > 0) {
          // Bulk delete
          for (const id of selectedIds) {
            await phuongThucThanhToanService.xoaPhuongThucThanhToan(id);
          }
          toast.success(`Đã xóa ${selectedIds.length} phương thức thanh toán`);
          setSelectedIds([]);
        } else {
          // Single delete
        await phuongThucThanhToanService.xoaPhuongThucThanhToan(deleting.id);
        toast.success("Đã xóa phương thức thanh toán");
        }
        fetchMethods();
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xóa");
      }
    }
    setIsDeleteDialogOpen(false);
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một phương thức thanh toán");
      return;
    }

    try {
      setUpdatingStatus(true);
      for (const id of selectedIds) {
        await phuongThucThanhToanService.capNhatTrangThaiPhuongThucThanhToan(id);
      }
      toast.success(`Đã cập nhật trạng thái ${selectedIds.length} phương thức thanh toán`);
      setSelectedIds([]);
      fetchMethods();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý phương thức thanh toán</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button 
                variant="secondary" 
                onClick={handleBulkUpdateStatus} 
                disabled={updatingStatus}
                className="gap-2"
              >
                {updatingStatus ? (
                  "Đang cập nhật..."
                ) : (
                  <>
                    Cập nhật trạng thái ({selectedIds.length})
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
                <Trash className="h-4 w-4" />
                Xóa ({selectedIds.length})
              </Button>
            </>
          )}
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" />Thêm mới</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={methods.length > 0 && selectedIds.length === methods.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>STT</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên phương thức</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.length === 0 ? (
                  <TableRow key="empty-row">
                    <TableCell colSpan={7} className="text-center text-slate-500">Chưa có phương thức nào</TableCell>
                  </TableRow>
                ) : methods.map((method, index) => (
                  <TableRow key={method.id ? method.id : `row-${index}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(method.id)}
                        onCheckedChange={(checked) => handleSelectOne(method.id, checked as boolean)}
                        aria-label={`Select ${method.ten_phuong_thuc_thanh_toan}`}
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{method.ma_phuong_thuc_thanh_toan}</TableCell>
                    <TableCell>{method.ten_phuong_thuc_thanh_toan}</TableCell>
                    <TableCell>{method.mo_ta}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        method.trang_thai ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {method.trang_thai ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => openEdit(method)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => openDelete(method)}><Trash className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog thêm/sửa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật" : "Thêm mới"} phương thức thanh toán</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Mã phương thức</label>
              <Input
                value={form.ma_phuong_thuc_thanh_toan || ''}
                onChange={e => setForm(f => ({ ...f, ma_phuong_thuc_thanh_toan: e.target.value.toUpperCase() }))}
                placeholder="Nhập mã phương thức"
                maxLength={10}
                disabled={!!editing}
              />
              {editing && (
                <p className="text-sm text-slate-500 mt-1">Không thể thay đổi mã phương thức khi cập nhật</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên phương thức <span className="text-red-500">*</span></label>
              <Input
                value={form.ten_phuong_thuc_thanh_toan || ''}
                onChange={e => setForm(f => ({ ...f, ten_phuong_thuc_thanh_toan: e.target.value }))}
                placeholder="Nhập tên phương thức"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <Input
                value={form.mo_ta || ''}
                onChange={e => setForm(f => ({ ...f, mo_ta: e.target.value }))}
                placeholder="Nhập mô tả (không bắt buộc)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>{editing ? "Cập nhật" : "Thêm mới"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn xóa phương thức này không?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 