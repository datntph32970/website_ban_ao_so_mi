"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import { nhanVienService } from "@/services/nhan-vien.service";
import { getAvatarByRole } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NhanVien {
  id_nhan_vien: string;
  ma_nhan_vien: string;
  ten_nhan_vien: string;
  email: string;
  so_dien_thoai: string;
  ngay_sinh: string;
  dia_chi: string;
  cccd: string;
  gioi_tinh: string;
  trang_thai: string;
  taiKhoanNhanVien: {
    id_tai_khoan: string;
    ma_tai_khoan: string;
    ten_dang_nhap: string;
    chuc_vu: string;
  };
}

export default function ProfilePage() {
  const [nhanVien, setNhanVien] = useState<NhanVien | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<NhanVien>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNhanVienInfo = async () => {
      try {
        setIsLoading(true);
        const response = await authService.getNhanVienDangDangNhap();
        if (Array.isArray(response) && response.length > 0) {
          setNhanVien(response[0]);
          setEditedData(response[0]);
        }
      } catch (error) {
        console.error('Error fetching employee info:', error);
        toast.error('Không thể tải thông tin nhân viên');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNhanVienInfo();
  }, []);

  const formatChucVu = (chucVu: string) => {
    switch (chucVu) {
      case 'Admin':
        return 'Quản trị viên';
      case 'NhanVien':
        return 'Nhân viên';
      default:
        return chucVu;
    }
  };

  const handleInputChange = (field: keyof NhanVien, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveClick = () => {
    if (!editedData.ten_nhan_vien || !editedData.email || !editedData.so_dien_thoai || 
        !editedData.gioi_tinh || !editedData.cccd || !editedData.dia_chi || !editedData.ngay_sinh) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedData.email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    // Validate phone number
    if (!/^[0-9]{10}$/.test(editedData.so_dien_thoai)) {
      toast.error('Số điện thoại phải có 10 chữ số');
      return;
    }

    // Validate CCCD
    if (!/^[0-9]{12}$/.test(editedData.cccd)) {
      toast.error('CCCD phải có 12 chữ số');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleSave = async () => {
    try {
      // We know these values exist because we validated them in handleSaveClick
      const updateData = {
        ho_ten: editedData.ten_nhan_vien!,
        email: editedData.email!,
        so_dien_thoai: editedData.so_dien_thoai!,
        gioi_tinh: editedData.gioi_tinh!,
        cccd: editedData.cccd!,
        dia_chi: editedData.dia_chi!,
        ngay_sinh: new Date(editedData.ngay_sinh!)
      };

      const response = await nhanVienService.capNhatThongTinNhanVien(updateData);
      toast.success('Cập nhật thông tin thành công');
      setIsEditing(false);
      setShowConfirmDialog(false);
      
      // Refresh employee data
      const newData = await authService.getNhanVienDangDangNhap();
      if (Array.isArray(newData) && newData.length > 0) {
        setNhanVien(newData[0]);
        setEditedData(newData[0]);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data || 'Không thể cập nhật thông tin');
      setShowConfirmDialog(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Hồ sơ cá nhân</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={nhanVien ? getAvatarByRole(nhanVien.taiKhoanNhanVien.chuc_vu) : '/avatars/default-avatar.png'} 
                    alt={nhanVien?.ten_nhan_vien} 
                  />
                  <AvatarFallback>{nhanVien?.ten_nhan_vien?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl font-bold">{nhanVien?.ten_nhan_vien}</CardTitle>
              <p className="text-sm text-slate-500">{formatChucVu(nhanVien?.taiKhoanNhanVien.chuc_vu || '')}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Mã nhân viên</p>
                  <p className="font-medium">{nhanVien?.ma_nhan_vien}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Email</p>
                  <p className="font-medium">{nhanVien?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Số điện thoại</p>
                  <p className="font-medium">{nhanVien?.so_dien_thoai}</p>
                </div>
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/auth/change-password')}
                  >
                    Đổi mật khẩu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Thông tin chi tiết</CardTitle>
              <div className="space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setEditedData(nhanVien || {});
                    }}>
                      Hủy
                    </Button>
                    <Button onClick={handleSaveClick}>Lưu</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    value={editedData.ten_nhan_vien || ''}
                    onChange={(e) => handleInputChange('ten_nhan_vien', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={editedData.so_dien_thoai || ''}
                    onChange={(e) => handleInputChange('so_dien_thoai', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cccd">CCCD</Label>
                  <Input
                    id="cccd"
                    value={editedData.cccd || ''}
                    onChange={(e) => handleInputChange('cccd', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Ngày sinh</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={editedData.ngay_sinh ? format(new Date(editedData.ngay_sinh), 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleInputChange('ngay_sinh', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Giới tính</Label>
                  <Input
                    id="gender"
                    value={editedData.gioi_tinh || ''}
                    onChange={(e) => handleInputChange('gioi_tinh', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={editedData.dia_chi || ''}
                    onChange={(e) => handleInputChange('dia_chi', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Thông tin tài khoản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tên đăng nhập</Label>
                    <Input
                      value={nhanVien?.taiKhoanNhanVien.ten_dang_nhap || ''}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chức vụ</Label>
                    <Input
                      value={formatChucVu(nhanVien?.taiKhoanNhanVien.chuc_vu || '')}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận cập nhật</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn cập nhật thông tin cá nhân không?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave}>
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 