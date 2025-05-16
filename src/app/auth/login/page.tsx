'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { CustomerLayout } from '@/components/layout/CustomerLayout';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    ten_dang_nhap: '',
    mat_khau: '',
  });
  const [loading, setLoading] = useState(false);

  // Xóa token và role cũ khi vào trang login
  useEffect(() => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userRole', { path: '/' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Đăng nhập
      const loginResponse = await authService.login(formData);
      
      // Lấy thông tin người dùng
      const user = await authService.getCurrentUser();
      
      // Kiểm tra xem người dùng đã đổi mật khẩu chưa
      if (!user.da_doi_mat_khau && user.chuc_vu !== 'KhachHang') {
        toast('Vui lòng đổi mật khẩu lần đầu', {
          icon: '🔒',
          duration: 4000,
        });
        router.push('/auth/change-password');
        return;
      }

      // Xử lý chuyển hướng dựa trên vai trò
      const from = searchParams.get('from');
      toast.success('Đăng nhập thành công');

      if (user.chuc_vu === 'KhachHang') {
        // Nếu là khách hàng, chuyển đến trang chủ khách hàng
        router.push('/');
      } else {
        // Nếu là Admin hoặc NhanVien, chuyển đến trang admin
        router.push(from || '/admin/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Đăng nhập vào Website
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="ten_dang_nhap" className="sr-only">
                  Tên đăng nhập
                </label>
                <input
                  id="ten_dang_nhap"
                  name="ten_dang_nhap"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Tên đăng nhập"
                  value={formData.ten_dang_nhap}
                  onChange={(e) => setFormData({ ...formData, ten_dang_nhap: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="mat_khau" className="sr-only">
                  Mật khẩu
                </label>
                <input
                  id="mat_khau"
                  name="mat_khau"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Mật khẩu"
                  value={formData.mat_khau}
                  onChange={(e) => setFormData({ ...formData, mat_khau: e.target.value })}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>

            <div className="text-sm text-center">
              <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Chưa có tài khoản? Đăng ký
              </Link>
            </div>
          </form>
        </div>
      </div>
    </CustomerLayout>
  );
} 