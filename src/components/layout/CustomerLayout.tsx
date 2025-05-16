import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, User, ShoppingCart, Search, LogOut, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { gioHangService } from "@/services/gio-hang.service";
import { toast } from "react-hot-toast";

interface CustomerLayoutProps {
  children: ReactNode;
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    const userRole = Cookies.get('userRole');
    setIsLoggedIn(!!token);
    setIsCustomer(userRole === 'KhachHang');

    if (token && userRole === 'KhachHang') {
      loadCartItems();
    }
  }, []);

  const loadCartItems = async () => {
    try {
      setIsLoadingCart(true);
      const response = await gioHangService.getMyCart();
      setCartItemCount(response.totalItems);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Không thể tải thông tin giỏ hàng');
    } finally {
      setIsLoadingCart(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userRole', { path: '/' });
    window.location.href = '/auth/login';
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    if (!isCustomer) {
      toast.error('Chỉ khách hàng mới có thể truy cập giỏ hàng');
      return;
    }
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">FIFTY STORE</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm font-medium hover:text-blue-600">
                Trang chủ
              </Link>
              <Link href="/products" className="text-sm font-medium hover:text-blue-600">
                Sản phẩm
              </Link>
              {/* <Link href="/sale" className="text-sm font-medium hover:text-blue-600">
                Khuyến mãi
              </Link> */}              
              <Link href="/contact" className="text-sm font-medium hover:text-blue-600">
                Liên hệ
              </Link>
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-[300px] pl-8"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={handleCartClick}
                disabled={isLoadingCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[10px] font-medium text-white flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <User className="h-5 w-5" />
                </Button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                      {isLoggedIn ? (
                        <>
                          <Link 
                            href="/account" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Hồ sơ cá nhân
                          </Link>
                          <Link 
                            href="/account/orders" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Đơn hàng của tôi
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            role="menuitem"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Đăng xuất
                          </button>
                        </>
                      ) : (
                        <>
                          <Link 
                            href="/auth/login" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Đăng nhập
                          </Link>
                          <Link 
                            href="/auth/register" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Đăng ký
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Về FIFTY STORE</h3>
              <p className="text-slate-400 text-sm">
                Chuyên cung cấp các sản phẩm áo sơ mi chính hãng với chất lượng tốt nhất cho khách hàng.
              </p>
            </div>
            {/* <div>
              <h3 className="text-lg font-bold mb-4">Thông tin</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-white text-sm">
                    Giới thiệu
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-white text-sm">
                    Liên hệ
                  </Link>
                </li>
                <li>
                  <Link href="/policy" className="text-slate-400 hover:text-white text-sm">
                    Chính sách
                  </Link>
                </li>
              </ul>
            </div> */}
            <div>
              <h3 className="text-lg font-bold mb-4">Hỗ trợ khách hàng</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-slate-400 hover:text-white text-sm">
                    Chính sách vận chuyển
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-slate-400 hover:text-white text-sm">
                    Chính sách đổi trả
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-slate-400 hover:text-white text-sm">
                    Câu hỏi thường gặp
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Thông tin liên hệ</h3>
              <ul className="space-y-2">
              <li className="text-slate-400 text-sm">  
                <a 
                  href="https://www.facebook.com/profile.php?id=61576264940151"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  FIFTY STORE
                </a> 
                </li>
                <li className="text-slate-400 text-sm">
                  Hotline: 1900 xxxx
                </li>
                <li className="text-slate-400 text-sm">
                  Email: support@fiftystore.com
                </li>                
                <li className="text-slate-400 text-sm">
                  Địa chỉ: Trịnh Văn Bô, Xuân Phương, Nam Từ Liêm, Hà Nội
                </li>
              </ul>
            </div>
            <div className=" max-w-md mx-auto rounded-xl overflow-hidden border">
      <iframe
        src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61576264940151&tabs=timeline&width=450&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
        width="450"
        height="400"
        style={{ border: "none", overflow: "hidden" }}
        scrolling="no"
        frameBorder={0}
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      ></iframe>
    </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
            © 2025 FIFTY STORE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
} 