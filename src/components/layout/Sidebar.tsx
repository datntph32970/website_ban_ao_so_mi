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
  UserCircle,
  CreditCard
} from "lucide-react";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const menuItems = [
  { name: "Thống kê", href: "/admin/dashboard", icon: LayoutDashboard, roles: ['Admin', 'NhanVien'] },
  { name: "Bán hàng tại quầy", href: "/admin/pos", icon: ShoppingCart, roles: ['Admin', 'NhanVien'] },
  { name: "Sản phẩm", href: "/admin/products", icon: ShoppingBag, roles: ['Admin', 'NhanVien'] },
  { name: "Thuộc tính sản phẩm", href: "/admin/products/attributes", icon: Tags, roles: ['Admin'] },
  { name: "Nhân viên", href: "/admin/employees", icon: Users, roles: ['Admin'] },
  { name: "Khách hàng", href: "/admin/customers", icon: UserCircle, roles: ['Admin', 'NhanVien'] },
  { name: "Đơn hàng", href: "/admin/orders", icon: Package, roles: ['Admin', 'NhanVien'] },
  { name: "Khuyến mãi", href: "/admin/promotions", icon: Percent, roles: ['Admin', 'NhanVien'] },
  { name: "Giảm giá", href: "/admin/discounts", icon: Tags, roles: ['Admin', 'NhanVien'] },
  { name: "Phương thức thanh toán", href: "/admin/payment-methods", icon: CreditCard, roles: ['Admin'] },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings, roles: ['Admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Get user role from cookie
    const role = Cookies.get('userRole');
    if (role) {
      setUserRole(role);
    }
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

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="h-screen w-64 bg-slate-900 text-white p-5 fixed left-0 top-0">
      <div className="flex items-center mb-10 mt-3">
        <ShoppingBag className="h-8 w-8 mr-2 text-blue-400" />
        <h1 className="text-xl font-bold"> FIFTY STORE</h1>
      </div>

      <nav className="space-y-2">
        {filteredMenuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
