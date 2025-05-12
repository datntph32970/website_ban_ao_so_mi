import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Định nghĩa các route và role được phép truy cập
const routePermissions = {
  '/admin/dashboard': ['Admin', 'NhanVien', 'KhachHang'],
  '/admin/customers': ['Admin', 'NhanVien'],
  '/admin/products': ['Admin', 'NhanVien'],
  '/admin/orders': ['Admin', 'NhanVien'],
  '/admin/promotions': ['Admin', 'NhanVien'],
  '/admin/discounts': ['Admin', 'NhanVien'],
  '/admin/pos': ['Admin', 'NhanVien'],
  '/admin/reports': ['Admin'],
  '/admin/settings': ['Admin'],
};

export async function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  if (isAdminRoute) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Kiểm tra quyền truy cập
    const userRole = request.cookies.get('userRole')?.value;
    const path = request.nextUrl.pathname;

    // Nếu không có role hoặc role không được phép truy cập
    if (!userRole || !isRouteAllowed(path, userRole)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Authorization', `Bearer ${token}`);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// Hàm kiểm tra xem role có được phép truy cập route không
function isRouteAllowed(path: string, role: string): boolean {
  // Tìm route phù hợp nhất
  const matchingRoute = Object.keys(routePermissions).find(route => 
    path.startsWith(route)
  );

  if (!matchingRoute) return false;

  return routePermissions[matchingRoute as keyof typeof routePermissions].includes(role);
}

// Chỉ áp dụng middleware cho các route bắt đầu bằng /admin
export const config = {
  matcher: '/admin/:path*'
} 