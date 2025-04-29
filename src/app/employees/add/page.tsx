'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateNhanVienDTO, ChucVu } from '@/types/nhan-vien';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { nhanVienService } from '@/services/nhan-vien.service';

export default function AddEmployeePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateNhanVienDTO, string>>>({});
  const [formData, setFormData] = useState<CreateNhanVienDTO>({
    ten_dang_nhap: '',
    chuc_vu: ChucVu.NHAN_VIEN,
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    ngay_sinh: '',
    dia_chi: '',
    cccd: '',
    gioi_tinh: '',
    trang_thai: 'HoatDong'
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateNhanVienDTO, string>> = {};

    // Validate tên đăng nhập
    if (!formData.ten_dang_nhap) {
      newErrors.ten_dang_nhap = 'Vui lòng nhập tên đăng nhập';
    } else if (formData.ten_dang_nhap.length < 3) {
      newErrors.ten_dang_nhap = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    // Validate họ tên
    if (!formData.ho_ten) {
      newErrors.ho_ten = 'Vui lòng nhập họ và tên';
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate số điện thoại
    if (!formData.so_dien_thoai) {
      newErrors.so_dien_thoai = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.so_dien_thoai)) {
      newErrors.so_dien_thoai = 'Số điện thoại phải có 10 chữ số';
    }

    // Validate ngày sinh
    if (!formData.ngay_sinh) {
      newErrors.ngay_sinh = 'Vui lòng chọn ngày sinh';
    }

    // Validate CCCD
    if (!formData.cccd) {
      newErrors.cccd = 'Vui lòng nhập số CCCD';
    } else if (!/^[0-9]{12}$/.test(formData.cccd)) {
      newErrors.cccd = 'CCCD phải có 12 chữ số';
    }

    // Validate giới tính
    if (!formData.gioi_tinh) {
      newErrors.gioi_tinh = 'Vui lòng chọn giới tính';
    }

    // Validate địa chỉ
    if (!formData.dia_chi) {
      newErrors.dia_chi = 'Vui lòng nhập địa chỉ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setIsLoading(true);
    try {
      await nhanVienService.themNhanVien(formData);
      toast.success('Thêm nhân viên thành công');
      // Reset form
      setFormData({
        ten_dang_nhap: '',
        chuc_vu: ChucVu.NHAN_VIEN,
        ho_ten: '',
        email: '',
        so_dien_thoai: '',
        ngay_sinh: '',
        dia_chi: '',
        cccd: '',
        gioi_tinh: '',
        trang_thai: 'HoatDong'
      });
      // Clear errors
      setErrors({});
    } catch (error: any) {
      console.error('Error creating employee:', error);
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền thêm nhân viên');
      } else if (error.response?.status === 400) {
        // Hiển thị lỗi validation từ API
        const errorMessage = error.response.data;
        toast.error(errorMessage);
        
        // Set error cho trường tương ứng
        if (errorMessage.includes('Tên đăng nhập')) {
          setErrors(prev => ({
            ...prev,
            ten_dang_nhap: errorMessage
          }));
        } else if (errorMessage.includes('Email')) {
          setErrors(prev => ({
            ...prev,
            email: errorMessage
          }));
        } else if (errorMessage.includes('Số điện thoại')) {
          setErrors(prev => ({
            ...prev,
            so_dien_thoai: errorMessage
          }));
        } else if (errorMessage.includes('CCCD')) {
          setErrors(prev => ({
            ...prev,
            cccd: errorMessage
          }));
        }
      } else {
        toast.error('Có lỗi xảy ra khi thêm nhân viên. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateNhanVienDTO, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/employees')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thêm Nhân Viên Mới</h1>
            <p className="text-muted-foreground">Điền thông tin để tạo tài khoản nhân viên mới</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin tài khoản</CardTitle>
                <CardDescription>Nhập thông tin đăng nhập và phân quyền cho nhân viên</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ten_dang_nhap">Tên đăng nhập</Label>
                    <Input
                      id="ten_dang_nhap"
                      value={formData.ten_dang_nhap}
                      onChange={(e) => handleChange('ten_dang_nhap', e.target.value)}
                      required
                      placeholder="Nhập tên đăng nhập"
                      disabled={isLoading}
                      className={errors.ten_dang_nhap ? 'border-red-500' : ''}
                    />
                    {errors.ten_dang_nhap && (
                      <p className="text-sm text-red-500">{errors.ten_dang_nhap}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chuc_vu">Chức vụ</Label>
                    <Select
                      value={formData.chuc_vu}
                      onValueChange={(value) => handleChange('chuc_vu', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chức vụ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ChucVu.ADMIN}>Admin</SelectItem>
                        <SelectItem value={ChucVu.NHAN_VIEN}>Nhân viên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Nhập thông tin chi tiết về nhân viên</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ho_ten">Họ và tên</Label>
                    <Input
                      id="ho_ten"
                      value={formData.ho_ten}
                      onChange={(e) => handleChange('ho_ten', e.target.value)}
                      required
                      placeholder="Nhập họ và tên"
                      disabled={isLoading}
                      className={errors.ho_ten ? 'border-red-500' : ''}
                    />
                    {errors.ho_ten && (
                      <p className="text-sm text-red-500">{errors.ho_ten}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      placeholder="Nhập địa chỉ email"
                      disabled={isLoading}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="so_dien_thoai">Số điện thoại</Label>
                    <Input
                      id="so_dien_thoai"
                      value={formData.so_dien_thoai}
                      onChange={(e) => handleChange('so_dien_thoai', e.target.value)}
                      required
                      placeholder="Nhập số điện thoại"
                      disabled={isLoading}
                      className={errors.so_dien_thoai ? 'border-red-500' : ''}
                    />
                    {errors.so_dien_thoai && (
                      <p className="text-sm text-red-500">{errors.so_dien_thoai}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ngay_sinh">Ngày sinh</Label>
                    <Input
                      id="ngay_sinh"
                      type="date"
                      value={formData.ngay_sinh}
                      onChange={(e) => handleChange('ngay_sinh', e.target.value)}
                      required
                      disabled={isLoading}
                      className={errors.ngay_sinh ? 'border-red-500' : ''}
                    />
                    {errors.ngay_sinh && (
                      <p className="text-sm text-red-500">{errors.ngay_sinh}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cccd">CCCD</Label>
                    <Input
                      id="cccd"
                      value={formData.cccd}
                      onChange={(e) => handleChange('cccd', e.target.value)}
                      required
                      placeholder="Nhập số CCCD"
                      disabled={isLoading}
                      className={errors.cccd ? 'border-red-500' : ''}
                    />
                    {errors.cccd && (
                      <p className="text-sm text-red-500">{errors.cccd}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gioi_tinh">Giới tính</Label>
                    <Select
                      value={formData.gioi_tinh}
                      onValueChange={(value) => handleChange('gioi_tinh', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={errors.gioi_tinh ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nam">Nam</SelectItem>
                        <SelectItem value="Nữ">Nữ</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gioi_tinh && (
                      <p className="text-sm text-red-500">{errors.gioi_tinh}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dia_chi">Địa chỉ</Label>
                    <Input
                      id="dia_chi"
                      value={formData.dia_chi}
                      onChange={(e) => handleChange('dia_chi', e.target.value)}
                      required
                      placeholder="Nhập địa chỉ"
                      disabled={isLoading}
                      className={errors.dia_chi ? 'border-red-500' : ''}
                    />
                    {errors.dia_chi && (
                      <p className="text-sm text-red-500">{errors.dia_chi}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/employees')}
              className="min-w-[100px]"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="min-w-[100px]"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : 'Thêm nhân viên'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
} 