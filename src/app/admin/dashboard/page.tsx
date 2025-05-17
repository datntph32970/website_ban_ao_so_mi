"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, DollarSign, TrendingUp, ArrowUp } from "lucide-react";
import { thongKeService } from "@/services/thong-ke.service";
import { sanPhamService } from "@/services/san-pham.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  TooltipProps
} from "recharts";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import Link from "next/link";

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

interface ThongKeDoanhThuResponse {
  thang?: number;
  nam: number;
  doanh_thu: number;
}

interface SanPhamBanChay {
  id_san_pham: string;
  ma_san_pham: string;
  ten_san_pham: string;
  mo_ta: string;
  so_luong_ban: number;
}

// Add interface for product detail response
interface GiamGia {
  kieu_giam_gia: 'PhanTram' | 'TienMat';
  gia_tri_giam: number;
  trang_thai: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
}

interface SanPhamChiTiet {
  id_san_pham: string;
  ma_san_pham: string;
  ten_san_pham: string;
  mo_ta: string;
  url_anh_mac_dinh: string;
  sanPhamChiTiets: Array<{
    gia_ban: number;
    trang_thai: string;
    giamGia?: GiamGia;
  }>;
}

interface SanPhamBanChayChiTiet extends SanPhamBanChay {
  thong_tin_chi_tiet?: {
    url_anh_mac_dinh: string;
    gia_ban_thap_nhat: number;
    gia_ban_cao_nhat: number;
    gia_sau_giam_thap_nhat: number;
    gia_sau_giam_cao_nhat: number;
  };
}

interface ThongKeSanPhamResponse {
  thang: number;
  nam: number;
  san_pham_ban_chay: SanPhamBanChay[];
  tong_san_pham: number;
  message: string;
}

interface ThongKeDonHangResponse {
  tuan?: number;
  nam: number;
  so_don_hang: number;
}

interface NhanVienDoanhThu {
  nhan_vien: {
    id: string;
    ma_nhan_vien: string;
    ten_nhan_vien: string;
    email: string;
    so_dien_thoai: string;
  };
  doanh_thu: number;
}

interface ThongKeNhanVienResponse {
  thang: number;
  nam: number;
  tong_nhan_vien: number;
  message: string;
}

interface ThongKeNhanVienDoanhThuResponse {
  thang: number;
  nam: number;
  danh_sach: NhanVienDoanhThu[];
  tong_nhan_vien: number;
  message: string;
}

// Component Props Types
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: {
      name: string;
      revenue?: number;
      orders?: number;
    };
    dataKey?: string;
  }>;
  label?: string;
}

// Dữ liệu cho biểu đồ doanh thu theo tháng
const revenueData = [
  { name: 'T1', revenue: 125000000 },
  { name: 'T2', revenue: 138000000 },
  { name: 'T3', revenue: 142000000 },
  { name: 'T4', revenue: 130000000 },
  { name: 'T5', revenue: 145000000 },
  { name: 'T6', revenue: 156000000 },
];

// Dữ liệu cho biểu đồ số lượng đơn hàng theo ngày trong tuần gần đây
const orderData = [
  { name: 'T2', orders: 28 },
  { name: 'T3', orders: 32 },
  { name: 'T4', orders: 36 },
  { name: 'T5', orders: 42 },
  { name: 'T6', orders: 48 },
  { name: 'T7', orders: 56 },
  { name: 'CN', orders: 38 },
];

export default function DashboardPage() {
  const [doanhThuThang, setDoanhThuThang] = useState<Array<{ name: string; revenue: number }>>([]);
  const [doanhThuNam, setDoanhThuNam] = useState<number>(0);
  const [donHangTuan, setDonHangTuan] = useState<Array<{ name: string; orders: number }>>([]);
  const [tongDonHangThang, setTongDonHangThang] = useState<number>(0);
  const [tongDonHangThangTruoc, setTongDonHangThangTruoc] = useState<number>(0);
  const [tongNhanVien, setTongNhanVien] = useState<number>(0);
  const [tongNhanVienThangTruoc, setTongNhanVienThangTruoc] = useState<number>(0);
  const [tongSanPhamThang, setTongSanPhamThang] = useState<number>(0);
  const [tongSanPhamThangTruoc, setTongSanPhamThangTruoc] = useState<number>(0);
  const [sanPhamBanChay, setSanPhamBanChay] = useState<SanPhamBanChayChiTiet[]>([]);
  const [nhanVienXuatSac, setNhanVienXuatSac] = useState<NhanVienDoanhThu[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<Array<{
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
    description: string;
    color: string;
    textColor: string;
  }>>([]);

  // Get current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Tính tuần hiện tại theo chuẩn ISO
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  const currentWeek = getWeekNumber(currentDate);

  const formatDate = (date: Date): string => {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dayNames[date.getDay()]} ${day}/${month}`;
  };

  // Calculate percentage change for orders
  const calculateOrderChange = (): { value: string; change: string } => {
    if (tongDonHangThangTruoc === 0) {
      if (tongDonHangThang > 0) {
        return { 
          value: tongDonHangThang.toString(), 
          change: "+100%" 
        };
      }
      return { 
        value: "0", 
        change: "0%" 
      };
    }
    
    const change = ((tongDonHangThang - tongDonHangThangTruoc) / tongDonHangThangTruoc) * 100;
    return {
      value: tongDonHangThang.toString(),
      change: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
    };
  };

  // Helper function to get previous month and year
  const getPreviousMonthData = () => {
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return { previousMonth, previousMonthYear };
  };

  const calculateDiscountedPrice = (price: number, giamGia?: GiamGia): number => {
    if (!giamGia || giamGia.trang_thai !== 'HoatDong') return price;
    
    const now = new Date();
    const startDate = new Date(giamGia.thoi_gian_bat_dau);
    const endDate = new Date(giamGia.thoi_gian_ket_thuc);
    
    if (now < startDate || now > endDate) return price;
    
    if (giamGia.kieu_giam_gia === 'PhanTram') {
      return price * (1 - giamGia.gia_tri_giam / 100);
    } else {
      return price - giamGia.gia_tri_giam;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get previous month data once
        const { previousMonth, previousMonthYear } = getPreviousMonthData();

        // Fetch monthly revenue for the last 6 months
        const revenuePromises = Array.from({ length: 6 }, (_, i) => {
          const month = currentMonth - i;
          const year = currentYear - (month <= 0 ? 1 : 0);
          const adjustedMonth = month <= 0 ? month + 12 : month;
          return thongKeService.getDoanhThuTheoThang(adjustedMonth, year);
        });
        const revenueResults = await Promise.all(revenuePromises);
        const formattedRevenueData = revenueResults.reverse()
          .map((result: ApiResponse<ThongKeDoanhThuResponse>, index) => {
            if (!result?.success) return null;
            const monthNumber = currentMonth - 5 + index;
            const adjustedMonth = monthNumber <= 0 ? monthNumber + 12 : monthNumber;
            return {
              name: 'T' + adjustedMonth,
              revenue: result.data.doanh_thu || 0
            };
          })
          .filter((item): item is { name: string; revenue: number } => item !== null);
        setDoanhThuThang(formattedRevenueData);

        // Fetch yearly revenue
        const yearlyRevenue = await thongKeService.getDoanhThuTheoNam(currentYear) as ApiResponse<ThongKeDoanhThuResponse>;
        setDoanhThuNam(yearlyRevenue?.success ? yearlyRevenue.data.doanh_thu : 0);

        // Fetch orders for the past 7 days with improved date formatting
        const today = new Date();
        const orderPromises = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - i)); // Get last 7 days in order
          const formattedDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
          return thongKeService.getDonHangTheoNgay(formattedDate);
        });
        
        const orderResults = await Promise.all(orderPromises);
        const formattedOrders = orderResults.map((result, index) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - index));
          return {
            name: formatDate(date),
            orders: result?.success ? result.data.so_don_hang : 0
          };
        });
        setDonHangTuan(formattedOrders);

        // Fetch total orders for current month
        const currentMonthOrders = await thongKeService.getDonHangTheoThang(currentMonth, currentYear);
        const previousMonthOrders = await thongKeService.getDonHangTheoThang(previousMonth, previousMonthYear);
        
        
        const currentOrders = currentMonthOrders?.data?.so_don_hang || 0;
        const previousOrders = previousMonthOrders?.data?.so_don_hang || 0;
        
        
        setTongDonHangThang(currentOrders);
        setTongDonHangThangTruoc(previousOrders);

        // Calculate order stats
        const calculateOrderStats = () => {
          if (previousOrders === 0) {
            if (currentOrders > 0) {
              return { 
                value: currentOrders.toString(), 
                change: "+100%" 
              };
            }
            return { 
              value: "0", 
              change: "0%" 
            };
          }
          
          const change = ((currentOrders - previousOrders) / previousOrders) * 100;
          return {
            value: currentOrders.toString(),
            change: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
          };
        };

        const orderStats = calculateOrderStats();

        // Fetch current month's employee data for total count
        const currentMonthEmployeeCount = await thongKeService.getNhanVienTheoThang(currentMonth, currentYear);
        const previousMonthEmployeeCount = await thongKeService.getNhanVienTheoThang(previousMonth, previousMonthYear);
        
        
        const currentEmployees = currentMonthEmployeeCount?.data?.so_nhan_vien_moi || 0;
        const previousEmployees = previousMonthEmployeeCount?.data?.so_nhan_vien_moi || 0;
        
        
        setTongNhanVien(currentEmployees);
        setTongNhanVienThangTruoc(previousEmployees);

        // Calculate employee stats
        const calculateEmployeeStats = () => {
          const newEmployees = currentEmployees;  // For new employees, we just use the current month's value
          return {
            value: currentEmployees.toString(),
            change: `+${newEmployees}`
          };
        };

        const employeeStats = calculateEmployeeStats();

        // Fetch product data and calculate stats immediately
        const currentMonthProducts = await thongKeService.getSanPhamMoiTheoThang(currentMonth, currentYear);
        const previousMonthProducts = await thongKeService.getSanPhamMoiTheoThang(previousMonth, previousMonthYear);
        
        
        const currentCount = currentMonthProducts?.data?.so_san_pham_moi || 0;
        const previousCount = previousMonthProducts?.data?.so_san_pham_moi || 0;
        
        
        setTongSanPhamThang(currentCount);
        setTongSanPhamThangTruoc(previousCount);

        // Calculate product stats
        const calculateProductStats = () => {
          if (previousCount === 0) {
            if (currentCount > 0) {
              return { 
                value: currentCount.toString(), 
                change: "+100%" 
              };
            }
            return { 
              value: "0", 
              change: "0%" 
            };
          }
          
          const change = ((currentCount - previousCount) / previousCount) * 100;
          return {
            value: currentCount.toString(),
            change: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
          };
        };

        const productStats = calculateProductStats();

        // Update dashboard stats with the calculated values
        const newDashboardStats = [
          {
            title: "Tổng doanh thu",
            value: formatCurrency(doanhThuNam),
            change: "+23%",
            icon: <DollarSign className="h-8 w-8 text-green-500" />,
            description: "so với năm trước",
            color: "bg-green-50",
            textColor: "text-green-500"
          },
          {
            title: "Tổng đơn hàng",
            value: orderStats.value,
            change: orderStats.change,
            icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
            description: "so với tháng trước",
            color: "bg-purple-50",
            textColor: "text-purple-500"
          },
          {
            title: "Nhân viên",
            value: employeeStats.value,
            change: employeeStats.change,
            icon: <Users className="h-8 w-8 text-orange-500" />,
            description: "nhân viên mới",
            color: "bg-orange-50",
            textColor: "text-orange-500"
          },
          {
            title: "Sản phẩm",
            value: productStats.value,
            change: productStats.change,
            icon: <Package className="h-8 w-8 text-blue-500" />,
            description: "so với tháng trước",
            color: "bg-blue-50",
            textColor: "text-blue-500"
          },
        ];

        setDashboardStats(newDashboardStats);

        // Fetch top selling products with details
        const topProducts = await thongKeService.getSanPhamBanChayTheoThang(currentMonth, currentYear) as ApiResponse<ThongKeSanPhamResponse>;
        if (topProducts?.success && Array.isArray(topProducts.data.san_pham_ban_chay)) {
          // Fetch detailed information for each product
          const productsWithDetails = await Promise.all(
            topProducts.data.san_pham_ban_chay.map(async (product) => {
              try {
                const chiTiet = await sanPhamService.getChiTietSanPham(product.id_san_pham) as unknown as SanPhamChiTiet;
                const activeVariants = chiTiet.sanPhamChiTiets.filter(spct => spct.trang_thai === 'HoatDong');
                
                const pricesWithDiscount = activeVariants.map(spct => ({
                  original: spct.gia_ban,
                  discounted: calculateDiscountedPrice(spct.gia_ban, spct.giamGia)
                }));

                const originalPrices = pricesWithDiscount.map(p => p.original);
                const discountedPrices = pricesWithDiscount.map(p => p.discounted);
                
                return {
                  ...product,
                  thong_tin_chi_tiet: {
                    url_anh_mac_dinh: chiTiet.url_anh_mac_dinh,
                    gia_ban_thap_nhat: Math.min(...originalPrices),
                    gia_ban_cao_nhat: Math.max(...originalPrices),
                    gia_sau_giam_thap_nhat: Math.min(...discountedPrices),
                    gia_sau_giam_cao_nhat: Math.max(...discountedPrices)
                  }
                };
              } catch (error) {
                console.error(`Error fetching details for product ${product.id_san_pham}:`, error);
                return product;
              }
            })
          );
          setSanPhamBanChay(productsWithDetails);
        } else {
          setSanPhamBanChay([]);
        }

        // Fetch top performing employees
        const currentMonthEmployees = await thongKeService.getNhanVienDoanhThuCaoNhatTheoThang(currentMonth, currentYear) as ApiResponse<ThongKeNhanVienDoanhThuResponse>;
        if (currentMonthEmployees?.success) {
          setNhanVienXuatSac(currentMonthEmployees.data.danh_sach);
        } else {
          setNhanVienXuatSac([]);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDoanhThuThang([]);
        setDoanhThuNam(0);
        setDonHangTuan([]);
        setTongDonHangThang(0);
        setTongDonHangThangTruoc(0);
        setTongNhanVien(0);
        setTongNhanVienThangTruoc(0);
        setSanPhamBanChay([]);
        setNhanVienXuatSac([]);
        setTongSanPhamThang(0);
        setTongSanPhamThangTruoc(0);
        setDashboardStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentMonth, currentYear, doanhThuNam]);

  // Các tab cho biểu đồ phân tích
  const analysisTabs = [
    { key: "revenue", label: "Doanh thu theo tháng" },
    { key: "orders", label: "Đơn hàng 7 ngày gần nhất" }
  ];

  const formatMillions = (value: number): string =>
    value >= 1000000 ? `${(value / 1000000).toFixed(1)}tr` : value.toString();

  // Sử dụng kiểu dữ liệu đã định nghĩa
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length > 0 && payload[0].payload) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-md shadow-sm">
          <p className="font-medium">{data.name}</p>
          {data.revenue !== undefined && (
            <p className="text-blue-600">
              {formatCurrency(data.revenue)}
            </p>
          )}
          {data.orders !== undefined && (
            <p className="text-purple-600">
              {data.orders} đơn hàng
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      ) : (
        <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-500">Xem tổng quan về cửa hàng của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <span className={`flex items-center ${stat.textColor} font-medium`}>
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </span>
                <span className="ml-1">{stat.description}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

          {/* Revenue Chart and Orders Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doanhThuThang}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                        tickFormatter={formatMillions}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
                <CardTitle>Đơn hàng 7 ngày gần nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={donHangTuan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                        name="Số đơn hàng"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Best Selling Products */}
          <Card className="shadow-sm mb-8">
          <CardHeader className="border-b pb-3">
            <CardTitle>Sản phẩm bán chạy trong tháng {currentMonth}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
                {sanPhamBanChay.map((product) => (
                  <div key={product.id_san_pham} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className="h-16 w-16 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={getImageUrl(product.thong_tin_chi_tiet?.url_anh_mac_dinh)}
                        alt={product.ten_san_pham}
                        className="object-cover w-full h-full"
                      />
                  </div>
                  <div className="flex-1">
                      <Link 
                        href={`/admin/products/${product.id_san_pham}`}
                        className="font-medium hover:text-blue-600 transition-colors"
                      >
                        {product.ten_san_pham}
                      </Link>
                      <p className="text-sm text-slate-500">Đã bán: {product.so_luong_ban} </p>
                  </div>
                  <div className="text-right">
                      {product.thong_tin_chi_tiet ? (
                        <div>
                          {product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat < product.thong_tin_chi_tiet.gia_ban_thap_nhat ? (
                            <>
                              <div className="text-sm line-through text-slate-500">
                                {formatCurrency(product.thong_tin_chi_tiet.gia_ban_thap_nhat)}
                                {product.thong_tin_chi_tiet.gia_ban_thap_nhat !== product.thong_tin_chi_tiet.gia_ban_cao_nhat && 
                                  ` - ${formatCurrency(product.thong_tin_chi_tiet.gia_ban_cao_nhat)}`}
                              </div>
                              <div className="font-bold text-red-600">
                                {formatCurrency(product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat)}
                                {product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat !== product.thong_tin_chi_tiet.gia_sau_giam_cao_nhat && 
                                  ` - ${formatCurrency(product.thong_tin_chi_tiet.gia_sau_giam_cao_nhat)}`}
                              </div>
                            </>
                          ) : (
                            <span className="font-bold text-green-600">
                              {formatCurrency(product.thong_tin_chi_tiet.gia_ban_thap_nhat)}
                              {product.thong_tin_chi_tiet.gia_ban_thap_nhat !== product.thong_tin_chi_tiet.gia_ban_cao_nhat && 
                                ` - ${formatCurrency(product.thong_tin_chi_tiet.gia_ban_cao_nhat)}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Chưa có giá</span>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

          {/* Revenue Analysis */}
          <Card className="shadow-sm mb-8">
          <CardHeader className="border-b">
            <CardTitle>Bảng phân tích doanh thu</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y">
              <div className="p-4 hover:bg-slate-50">
                <h3 className="font-medium">Doanh thu theo tháng</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-slate-500">Tháng hiện tại</p>
                      <p className="text-xl font-bold">{formatCurrency(doanhThuNam)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">So với tháng trước</p>
                    <p className="text-xl font-bold text-green-600">+23%</p>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-slate-50">
                  <h3 className="font-medium">Đơn hàng 7 ngày gần nhất</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-slate-500">Tổng số đơn</p>
                      <p className="text-xl font-bold">{donHangTuan.reduce((sum, item) => sum + item.orders, 0)}</p>
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">So với 7 ngày trước</p>
                    <p className="text-xl font-bold text-green-600">+18%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="mt-8">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Nhân viên xuất sắc</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {nhanVienXuatSac.map((nhanVien, index) => (
                    <div key={nhanVien.nhan_vien.id} className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="h-16 w-16 rounded-full bg-slate-200 mb-3 flex items-center justify-center overflow-hidden">
                    <span className="text-lg font-bold text-slate-500">NV</span>
                  </div>
                      <h3 className="font-medium text-center">{nhanVien.nhan_vien.ten_nhan_vien}</h3>
                      <p className="text-sm text-slate-500 mb-2">Doanh số: {formatCurrency(nhanVien.doanh_thu)}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    index === 0 ? "bg-yellow-100 text-yellow-800" :
                    index === 1 ? "bg-slate-100 text-slate-800" :
                    index === 2 ? "bg-amber-100 text-amber-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {index === 0 ? "#1" :
                    index === 1 ? "#2" :
                    index === 2 ? "#3" :
                    `#${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </AdminLayout>
  );
}
