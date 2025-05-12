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

export function Header() {
  const router = useRouter();

  const handleLogout = () => {
    try {
      authService.logout();
      toast.success('Đăng xuất thành công!');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
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
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            3
          </span>
        </Button>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src="/avatars/admin.png" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Hồ sơ</DropdownMenuItem>
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
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-slate-500">Quản trị viên</p>
          </div>
        </div>
      </div>
    </header>
  );
}
