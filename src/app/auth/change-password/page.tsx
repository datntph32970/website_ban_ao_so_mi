'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    mat_khau_cu: '',
    mat_khau_moi: '',
    xac_nhan_mat_khau_moi: '',
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        toast.error('Không thể lấy thông tin người dùng');
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.mat_khau_moi !== formData.xac_nhan_mat_khau_moi) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.mat_khau_moi.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword({
        ten_dang_nhap: user.ten_dang_nhap,
        mat_khau_cu: formData.mat_khau_cu,
        mat_khau_moi: formData.mat_khau_moi,
        xac_nhan_mat_khau_moi: formData.xac_nhan_mat_khau_moi,
      });
      toast.success('Đổi mật khẩu thành công!');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đổi mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vui lòng đổi mật khẩu để bảo vệ tài khoản của bạn
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="mat_khau_cu" className="sr-only">
                Mật khẩu hiện tại
              </label>
              <input
                id="mat_khau_cu"
                name="mat_khau_cu"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu hiện tại"
                value={formData.mat_khau_cu}
                onChange={(e) => setFormData({ ...formData, mat_khau_cu: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="mat_khau_moi" className="sr-only">
                Mật khẩu mới
              </label>
              <input
                id="mat_khau_moi"
                name="mat_khau_moi"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu mới"
                value={formData.mat_khau_moi}
                onChange={(e) => setFormData({ ...formData, mat_khau_moi: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="xac_nhan_mat_khau" className="sr-only">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="xac_nhan_mat_khau"
                name="xac_nhan_mat_khau"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Xác nhận mật khẩu mới"
                value={formData.xac_nhan_mat_khau_moi}
                onChange={(e) => setFormData({ ...formData, xac_nhan_mat_khau_moi: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 