"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { KhachHang, UpdateKhachHangDTO } from "@/types/khach-hang";
import { khachHangService } from "@/services/khach-hang.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCircle } from "lucide-react";
import AddressList from "./components/address-list";

export default function AccountPage() {
  const [profile, setProfile] = useState<KhachHang | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateKhachHangDTO | null>(null);

  const form = useForm<UpdateKhachHangDTO>({
    defaultValues: {
      ten_khach_hang: "",
      email: "",
      so_dien_thoai: "",
      ngay_sinh: "",
      gioi_tinh: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await khachHangService.getMyProfile();
        setProfile(response.profile);
        form.reset({
          ten_khach_hang: response.profile.ten_khach_hang,
          email: response.profile.email,
          so_dien_thoai: response.profile.so_dien_thoai,
          ngay_sinh: response.profile.ngay_sinh,
          gioi_tinh: response.profile.gioi_tinh,
        });
      } catch (error) {
        toast.error("Không thể tải thông tin người dùng");
      }
    };
    fetchProfile();
  }, [form]);

  const handleSubmit = (data: UpdateKhachHangDTO) => {
    setFormData(data);
  };

  const onConfirm = async () => {
    if (!formData) return;
    
    setIsLoading(true);
    try {
      const response = await khachHangService.capNhatProfile(formData);
      setProfile(response.profile);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      toast.error("Cập nhật thông tin thất bại");
    } finally {
      setIsLoading(false);
      setFormData(null);
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Thông tin tài khoản</h1>
            <p className="text-muted-foreground">
              Quản lý thông tin cá nhân của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thông tin cơ bản */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ten_khach_hang"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập họ và tên" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="so_dien_thoai"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập số điện thoại" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ngay_sinh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngày sinh</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gioi_tinh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giới tính</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn giới tính" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Nam">Nam</SelectItem>
                              <SelectItem value="Nữ">Nữ</SelectItem>
                              <SelectItem value="Khác">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <AlertDialog open={!!formData} onOpenChange={(open) => !open && setFormData(null)}>
                      <AlertDialogTrigger asChild>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận cập nhật</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn cập nhật thông tin tài khoản?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={onConfirm}>
                            {isLoading ? "Đang cập nhật..." : "Xác nhận"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Thông tin tài khoản */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Mã khách hàng</p>
                <p className="text-sm text-muted-foreground">{profile?.ma_khach_hang}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Tên đăng nhập</p>
                <p className="text-sm text-muted-foreground">{profile?.tai_khoan.ten_dang_nhap}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Trạng thái</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.trang_thai === 'HoatDong' ? 'Hoạt động' : profile?.trang_thai}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Ngày tạo tài khoản</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.ngay_tao ? new Date(profile.ngay_tao).toLocaleDateString("vi-VN") : ""}
                </p>
              </div>

              <Separator className="my-4" />
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/auth/change-password'}
              >
                Đổi mật khẩu
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Danh sách địa chỉ */}
        <AddressList />
      </div>
    </div>
  );
} 