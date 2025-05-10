import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');

  // Nếu đã đăng nhập và cố truy cập trang đăng nhập/đăng ký
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Nếu chưa đăng nhập và cố truy cập các trang được bảo vệ
  if (!isAuthPage && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Chỉ định các route cần được bảo vệ
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/orders/:path*',
    '/employees/:path*',
    '/customers/:path*',
    '/promotions/:path*',
    '/settings/:path*',
    '/login',
    '/register'
  ],
}; 