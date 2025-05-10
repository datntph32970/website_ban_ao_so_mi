"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Users,
  LayoutDashboard,
  Package,
  LogOut,
  Settings,
  ShoppingCart,
  Tags,
  Percent,
  UserCircle
} from "lucide-react";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sản phẩm", href: "/products", icon: ShoppingBag },
  { name: "Thuộc tính sản phẩm", href: "/products/attributes", icon: Tags },
  { name: "Nhân viên", href: "/employees", icon: Users },
  { name: "Khách hàng", href: "/customers", icon: UserCircle },
  { name: "Đơn hàng", href: "/orders", icon: Package },
  { name: "Bán hàng tại quầy", href: "/pos", icon: ShoppingCart },
  { name: "Khuyến mãi", href: "/promotions", icon: Percent },
  { name: "Giảm giá", href: "/discounts", icon: Tags },
  { name: "Cài đặt", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    try {
      authService.logout();
      toast.success('Đăng xuất thành công!');
      router.push('/login');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  return (
    <div className="h-screen w-64 bg-slate-900 text-white p-5 fixed left-0 top-0">
      <div className="flex items-center mb-10 mt-3">
        <ShoppingBag className="h-8 w-8 mr-2 text-blue-400" />
        <h1 className="text-xl font-bold">Shoes Admin</h1>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const ItemIcon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors ${
                isActive ? "bg-slate-800 text-blue-400" : ""
              }`}
            >
              <ItemIcon className={`h-5 w-5 ${isActive ? "text-blue-400" : ""}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-8 w-[calc(100%-40px)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition-colors bg-slate-800 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
