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
    const token = localStorage.getItem('token') || Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
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
      // Xóa token
      localStorage.removeItem('token');
      Cookies.remove('token');
      
      // Chuyển hướng về trang đăng nhập
      window.location.href = '/login';
      
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
      return Promise.reject({
        response: {
          status: 403,
          data: {
            message: 'Bạn không có quyền truy cập tính năng này.',
          },
        },
      });
    }

    // Xử lý lỗi 404 (Not Found)
    if (error.response.status === 404) {
      return Promise.reject({
        response: {
          status: 404,
          data: {
            message: 'Không tìm thấy tài nguyên yêu cầu.',
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

    // Xử lý các lỗi khác
    return Promise.reject(error);
  }
); 