import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api' || 'https://localhost:7211/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 giây timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        response: {
          data: {
            message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
          },
        },
      });
    }

    // Xử lý lỗi không có kết nối
    if (!error.response) {
      return Promise.reject({
        response: {
          data: {
            message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
          },
        },
      });
    }

    // Xử lý lỗi 401 (Unauthorized)
    if (error.response.status === 401) {
      // Chỉ redirect nếu không phải đang ở trang login
      if (!window.location.pathname.includes('/auth/login')) {
        Cookies.remove('token', { path: '/' });
        Cookies.remove('userRole', { path: '/' });
        const currentPath = window.location.pathname;
        window.location.href = `/auth/login?from=${encodeURIComponent(currentPath)}`;
      }
      return Promise.reject({
        response: {
          data: {
            message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          },
        },
      });
    }

    // Xử lý lỗi 403 (Forbidden)
    if (error.response.status === 403) {
      // Chỉ redirect nếu không phải đang ở trang 403
      if (!window.location.pathname.includes('/403')) {
        window.location.href = '/403';
      }
      return Promise.reject({
        response: {
          status: 403,
          data: {
            message: 'Bạn không có quyền truy cập tính năng này.',
          },
        },
      });
    }

    // Xử lý lỗi 500 (Internal Server Error)
    if (error.response.status === 500) {
      return Promise.reject({
        response: {
          status: 500,
          data: {
            message: 'Đã xảy ra lỗi từ máy chủ. Vui lòng thử lại sau.',
          },
        },
      });
    }

    return Promise.reject(error);
  }
); 