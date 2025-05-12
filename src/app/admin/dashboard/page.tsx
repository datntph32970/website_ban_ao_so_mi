"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, DollarSign, TrendingUp, ArrowUp } from "lucide-react";
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

// Định nghĩa kiểu dữ liệu cụ thể cho tooltip
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

// Dữ liệu cho biểu đồ doanh số theo danh mục sản phẩm
const categoryData = [
  { name: 'Giày thể thao', value: 55 },
  { name: 'Giày thời trang', value: 25 },
  { name: 'Giày chạy bộ', value: 15 },
  { name: 'Giày đá bóng', value: 5 },
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

// Dữ liệu sản phẩm bán chạy (từ dữ liệu được cung cấp)
const topSellingProducts = [
  {
    id: 1,
    name: "Giày Nike Air Force 1",
    sold: 42,
    price: 2500000,
    image: "/images/nike-air-force-1.png"
  },
  {
    id: 2,
    name: "Giày Nike Air Force 1",
    sold: 42,
    price: 2500000,
    image: "/images/nike-air-force-1.png"
  },
  {
    id: 3,
    name: "Giày Nike Air Force 1",
    sold: 42,
    price: 2500000,
    image: "/images/nike-air-force-1.png"
  },
  {
    id: 4,
    name: "Giày Nike Air Force 1",
    sold: 42,
    price: 2500000,
    image: "/images/nike-air-force-1.png"
  },
  {
    id: 5,
    name: "Giày Nike Air Force 1",
    sold: 42,
    price: 2500000,
    image: "/images/nike-air-force-1.png"
  }
];

// Màu cho biểu đồ tròn
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DashboardPage() {
  // Dữ liệu thực tế cho thống kê
  const dashboardStats = [
    {
      title: "Tổng doanh thu",
      value: "₫156.000.000",
      change: "+23%",
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      description: "so với tháng trước",
      color: "bg-green-50",
      textColor: "text-green-500"
    },
    {
      title: "Tổng đơn hàng",
      value: "324",
      change: "+18%",
      icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
      description: "so với tháng trước",
      color: "bg-purple-50",
      textColor: "text-purple-500"
    },
    {
      title: "Nhân viên",
      value: "12",
      change: "+2",
      icon: <Users className="h-8 w-8 text-orange-500" />,
      description: "nhân viên mới",
      color: "bg-orange-50",
      textColor: "text-orange-500"
    },
    {
      title: "Sản phẩm",
      value: "156",
      change: "+12%",
      icon: <Package className="h-8 w-8 text-blue-500" />,
      description: "so với tháng trước",
      color: "bg-blue-50",
      textColor: "text-blue-500"
    },
  ];

  // Các tab cho biểu đồ phân tích
  const analysisTabs = [
    { key: "revenue", label: "Doanh thu theo tháng" },
    { key: "orders", label: "Đơn hàng trong tuần qua" },
    { key: "categories", label: "Phân bổ theo loại giày" }
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);

  // Sử dụng kiểu dữ liệu đã định nghĩa
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length > 0 && payload[0].payload) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-md shadow-sm">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-blue-600">
            {formatCurrency(payload[0].value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-500">Xem tổng quan về cửa hàng bán giày của bạn</p>
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

      {/* Biểu đồ doanh thu và phân tích */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) => value >= 1000000
                      ? `${value / 1000000}tr`
                      : value
                    }
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
            <CardTitle>Đơn hàng trong tuần qua</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="Đơn hàng"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Phân bổ theo loại giày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="border-b pb-3">
            <CardTitle>Sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topSellingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className="h-16 w-16 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                    {/* Sử dụng placeholder khi không có ảnh thực tế */}
                    <span className="text-lg font-bold text-slate-400">AF1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-slate-500">Đã bán: {product.sold} đôi</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600">{formatCurrency(product.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <Card className="shadow-sm">
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
                    <p className="text-xl font-bold">₫156.000.000</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">So với tháng trước</p>
                    <p className="text-xl font-bold text-green-600">+23%</p>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-slate-50">
                <h3 className="font-medium">Đơn hàng trong tuần qua</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-slate-500">Tổng số đơn</p>
                    <p className="text-xl font-bold">324</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">So với tuần trước</p>
                    <p className="text-xl font-bold text-green-600">+18%</p>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-slate-50">
                <h3 className="font-medium">Phân bổ theo loại giày</h3>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categoryData.map((category, i) => (
                    <div key={i} className="p-2 rounded-md" style={{ backgroundColor: `${COLORS[i % COLORS.length]}20` }}>
                      <p className="text-sm font-medium" style={{ color: COLORS[i % COLORS.length] }}>{category.name}</p>
                      <p className="text-lg font-bold">{category.value}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Nhân viên xuất sắc</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <div key={index} className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="h-16 w-16 rounded-full bg-slate-200 mb-3 flex items-center justify-center overflow-hidden">
                    <span className="text-lg font-bold text-slate-500">NV</span>
                  </div>
                  <h3 className="font-medium text-center">Nguyễn Văn A</h3>
                  <p className="text-sm text-slate-500 mb-2">Doanh số: ₫25.000.000</p>
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
    </AdminLayout>
  );
}
