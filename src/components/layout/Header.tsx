"use client";

import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAvatarByRole } from "@/lib/utils";

interface TaiKhoanNhanVien {
  id_tai_khoan: string;
  ma_tai_khoan: string;
  ten_dang_nhap: string;
  trang_thai: string;
  da_doi_mat_khau: boolean;
  chuc_vu: string;
}

interface NhanVien {
  id_nhan_vien: string;
  ma_nhan_vien: string;
  ten_nhan_vien: string;
  email: string;
  so_dien_thoai: string;
  taiKhoanNhanVien: TaiKhoanNhanVien;
}

export function Header() {
  const router = useRouter();
  const [nhanVien, setNhanVien] = useState<NhanVien | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNhanVienInfo = async () => {
      try {
        console.log('Fetching employee info...');
        setIsLoading(true);
        const response = await authService.getNhanVienDangDangNhap();
        console.log('API Response:', response);
        
        if (Array.isArray(response) && response.length > 0) {
          console.log('Setting employee data:', response[0]);
          setNhanVien(response[0]);
        } else {
          console.log('Empty data');
        }
      } catch (error) {
        console.error('Error fetching employee info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNhanVienInfo();
  }, []);

  const handleLogout = () => {
    try {
      authService.logout();
      toast.success('Đăng xuất thành công!');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  // Format chức vụ để hiển thị
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

  return (
    <header className="h-16 fixed top-0 right-0 left-64 bg-white border-b border-slate-200 z-10 flex items-center justify-between px-6">
      <div className="flex items-center w-1/3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage 
                    src={nhanVien ? getAvatarByRole(nhanVien.taiKhoanNhanVien.chuc_vu) : '/avatars/default-avatar.png'} 
                    alt={nhanVien?.ten_nhan_vien || 'User'} 
                  />
                  <AvatarFallback>{nhanVien?.ten_nhan_vien?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">Hồ sơ</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Cài đặt</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div>
            <p className="text-sm font-medium">
              {isLoading ? 'Đang tải...' : nhanVien?.ten_nhan_vien || 'Chưa đăng nhập'}
            </p>
            <p className="text-xs text-slate-500">
              {isLoading ? 'Đang tải...' : 
                nhanVien ? formatChucVu(nhanVien.taiKhoanNhanVien.chuc_vu) : 'Chưa xác định'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
