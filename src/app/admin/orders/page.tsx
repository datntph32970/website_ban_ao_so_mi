"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Eye, 
  Search, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  User,
  Phone,
  Calendar,
  UserCircle,
  CreditCard,
  Receipt,
  FileText,
  Printer,
  Tag,
  DollarSign,
  ArrowLeftRight,
  ShoppingBag,
  Info,
  Filter,
  X
} from "lucide-react";
import { hoaDonService } from "@/services/hoa-don.service";
import { HoaDonAdminDTO } from "@/types/hoa-don";
import { toast } from "react-hot-toast";
import { phuongThucThanhToanService } from "@/services/phuong-thuc-thanh-toan.service";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InvoicePDF from '@/components/invoice/InvoicePDF';
import { InvoicePDFProps } from '@/components/invoice/InvoicePDF';

// Trạng thái đơn hàng
const orderStatus = {
  // Trạng thái cho hóa đơn tại quầy
  ChoTaiQuay: {
    label: "Chờ tại quầy",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-4 w-4 mr-1" />,
    type: "TaiQuay"
  },
  DaThanhToan: {
    label: "Đã thanh toán",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle2 className="h-4 w-4 mr-1" />,
    type: "TaiQuay"
  },
  // Trạng thái cho hóa đơn online
  DangChoXuLy: {
    label: "Đang chờ xử lý",
    color: "bg-blue-100 text-blue-800",
    icon: <Clock className="h-4 w-4 mr-1" />,
    type: "Online"
  },
  DangChuanBi: {
    label: "Đang chuẩn bị",
    color: "bg-blue-100 text-blue-800",
    icon: <Package className="h-4 w-4 mr-1" />,
    type: "Online"
  },
  DangGiaoHang: {
    label: "Đang giao hàng",
    color: "bg-blue-100 text-blue-800",
    icon: <Package className="h-4 w-4 mr-1" />,
    type: "Online"
  },
  HetHang: {
    label: "Hết hàng",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-4 w-4 mr-1" />,
    type: "Online"
  },
  ChuaThanhToan: {
    label: "Chưa thanh toán",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-4 w-4 mr-1" />,
    type: "Online"
  },
  DaHoanThanh: {
    label: "Đã hoàn thành",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle2 className="h-4 w-4 mr-1" />,
    type: "Online"
  },
  DaHuy: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-4 w-4 mr-1" />,
    type: "Online"
  },
  DaHoanTraMotPhan: {
    label: "Đã hoàn trả một phần",
    color: "bg-orange-100 text-orange-800",
    icon: <ArrowLeftRight className="h-4 w-4 mr-1" />,
    type: "Online"
  },
  DaHoanTraToanBo: {
    label: "Đã hoàn trả toàn bộ",
    color: "bg-red-100 text-red-800",
    icon: <ArrowLeftRight className="h-4 w-4 mr-1" />,
    type: "Online"
  }
};

// Loại hóa đơn
const orderTypes = {
  TaiQuay: "Tại quầy",
  Online: "Online"
};

// Add useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const OrderListPage = () => {
  const [orders, setOrders] = useState<HoaDonAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay
  const [selectedOrder, setSelectedOrder] = useState<HoaDonAdminDTO | null>(null);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [pagination, setPagination] = useState({
    trang_hien_tai: 1,
    so_phan_tu_tren_trang: 10,
    tong_so_trang: 1,
    tong_so_phan_tu: 0
  });
  const [filters, setFilters] = useState({
    trang_thai: "",
    loai_hoa_don: "",
    id_phuong_thuc_thanh_toan: "",
    ngay_tao_tu: "",
    ngay_tao_den: ""
  });
  const [paymentMethods, setPaymentMethods] = useState<{
    id_phuong_thuc_thanh_toan: string;
    ten_phuong_thuc_thanh_toan: string;
    ma_phuong_thuc_thanh_toan: string;
    mo_ta: string;
    trang_thai: boolean;
  }[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoicePDFProps['invoiceData'] | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await hoaDonService.getHoaDon({
        trang_hien_tai: pagination.trang_hien_tai,
        so_phan_tu_tren_trang: pagination.so_phan_tu_tren_trang,
        tim_kiem: debouncedSearchTerm || undefined,
        trang_thai: filters.trang_thai === "all" ? undefined : filters.trang_thai || undefined,
        loai_hoa_don: filters.loai_hoa_don === "all" ? undefined : filters.loai_hoa_don || undefined,
        id_phuong_thuc_thanh_toan: filters.id_phuong_thuc_thanh_toan === "all" ? undefined : filters.id_phuong_thuc_thanh_toan || undefined,
        ngay_tao_tu: filters.ngay_tao_tu || undefined,
        ngay_tao_den: filters.ngay_tao_den || undefined
      });

      setOrders(response.danh_sach);
      setPagination({
        trang_hien_tai: response.trang_hien_tai,
        so_phan_tu_tren_trang: response.so_phan_tu_tren_trang,
        tong_so_trang: response.tong_so_trang,
        tong_so_phan_tu: response.tong_so_phan_tu
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.trang_hien_tai, debouncedSearchTerm, filters]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await phuongThucThanhToanService.getDanhSachPhuongThucThanhToanHoatDong();
        console.log('Payment methods API response:', response);
        // Map the response to match the state structure
        const mappedResponse = response.map(method => ({
          id_phuong_thuc_thanh_toan: method.id_phuong_thuc_thanh_toan,
          ten_phuong_thuc_thanh_toan: method.ten_phuong_thuc_thanh_toan,
          ma_phuong_thuc_thanh_toan: method.ma_phuong_thuc_thanh_toan,
          mo_ta: method.mo_ta,
          trang_thai: method.trang_thai
        }));
        setPaymentMethods(mappedResponse);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        toast.error('Không thể tải danh sách phương thức thanh toán');
      }
    };
    fetchPaymentMethods();
  }, []);

  // Add effect to log payment methods state changes
  useEffect(() => {
    console.log('Payment methods state:', paymentMethods);
  }, [paymentMethods]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset status filter when order type changes
      if (key === 'loai_hoa_don') {
        newFilters.trang_thai = '';
      }
      
      return newFilters;
    });
    setPagination(prev => ({ ...prev, trang_hien_tai: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      trang_thai: "",
      loai_hoa_don: "",
      id_phuong_thuc_thanh_toan: "",
      ngay_tao_tu: "",
      ngay_tao_den: ""
    });
    setPagination(prev => ({ ...prev, trang_hien_tai: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, trang_hien_tai: newPage }));
  };

  const handleViewOrder = async (order: HoaDonAdminDTO) => {
    try {
      const orderDetail = await hoaDonService.getHoaDonById(order.id_hoa_don);
      setSelectedOrder(orderDetail);
    setIsViewOrderOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Không thể tải thông tin chi tiết hóa đơn');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handlePrintInvoice = async () => {
    if (!selectedOrder) return;
    try {
        console.log('Printing invoice for order:', selectedOrder.id_hoa_don);
        const response = await hoaDonService.inHoaDon(selectedOrder.id_hoa_don);
        console.log('Print response:', response);
        if (response.success) {
            setInvoiceData({
              thongTinCuaHang: response.data.thongTinCuaHang,
              thongTinHoaDon: response.data.thongTinHoaDon,
              thongTinKhachHang: response.data.thongTinKhachHang,
              chiTietHoaDon: response.data.chiTietHoaDon.map((item: {
                tenSanPham: string;
                mauSac: string;
                kichCo: string;
                soLuong: number;
                donGia: number;
                giaSauGiamGia: number;
                thanhTien: number;
              }) => ({
                tenSanPham: item.tenSanPham,
                mauSac: item.mauSac,
                kichCo: item.kichCo,
                soLuong: item.soLuong,
                donGia: item.donGia,
                giaSauGiamGia: item.giaSauGiamGia,
                thanhTien: item.thanhTien
              })),
              thongTinThanhToan: response.data.thongTinThanhToan,
              ghiChu: response.data.ghiChu
            });
            setIsPrintDialogOpen(true);
        } else {
            toast.error('Không thể tải thông tin hóa đơn');
        }
    } catch (error) {
        console.error('Error fetching invoice data:', error);
        toast.error('Có lỗi xảy ra khi tải thông tin hóa đơn');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý hóa đơn</h1>
          <p className="text-slate-500">Xem và quản lý hóa đơn của cửa hàng</p>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            className="pl-10"
            placeholder="Tìm theo mã HĐ, mã NV, tên NV, tên KH, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-4 w-4" />
            Bộ lọc
            {(filters.trang_thai || filters.loai_hoa_don || filters.id_phuong_thuc_thanh_toan || filters.ngay_tao_tu || filters.ngay_tao_den) && (
              <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {isFilterOpen && (
          <div key="filter-panel" className="bg-white p-4 rounded-lg border space-y-4">
            <div key="filter-header" className="flex items-center justify-between">
              <h3 key="filter-title" className="font-medium">Bộ lọc tìm kiếm</h3>
              <Button key="clear-filter" variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                <X className="h-4 w-4 mr-1" />
                Xóa bộ lọc
              </Button>
            </div>
            <div key="filter-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  key: "status-filter",
                  label: "Trạng thái",
                  value: filters.trang_thai,
                  onChange: (value: string) => handleFilterChange('trang_thai', value),
                  placeholder: "Chọn trạng thái",
                  options: Object.entries(orderStatus)
                    .filter(([_, value]) => {
                      if (!filters.loai_hoa_don || filters.loai_hoa_don === 'all') return true;
                      return value.type === filters.loai_hoa_don;
                    })
                    .map(([key, value]) => ({
                      key,
                      value: key,
                      label: (
                        <div key={`status-${key}`} className="flex items-center gap-2">
                          {value.icon}
                          {value.label}
                        </div>
                      )
                    }))
                },
                {
                  key: "type-filter",
                  label: "Loại hóa đơn",
                  value: filters.loai_hoa_don,
                  onChange: (value: string) => handleFilterChange('loai_hoa_don', value),
                  placeholder: "Chọn loại hóa đơn",
                  options: Object.entries(orderTypes).map(([key, value]) => ({
                    key,
                    value: key,
                    label: value
                  }))
                },
                {
                  key: "payment-filter",
                  label: "Phương thức thanh toán",
                  value: filters.id_phuong_thuc_thanh_toan,
                  onChange: (value: string) => handleFilterChange('id_phuong_thuc_thanh_toan', value),
                  placeholder: "Chọn phương thức",
                  options: paymentMethods
                    .filter(method => {
                      console.log('Filtering method:', method);
                      return method && method.id_phuong_thuc_thanh_toan && method.ten_phuong_thuc_thanh_toan;
                    })
                    .map((method, index) => {
                      console.log('Mapping method:', method);
                      return {
                        key: `payment-${method.id_phuong_thuc_thanh_toan}-${index}`,
                        value: method.id_phuong_thuc_thanh_toan,
                        label: method.ten_phuong_thuc_thanh_toan
                      };
                    })
                },
                {
                  key: "date-filter",
                  label: "Ngày tạo",
                  content: (
                    <div key="date-range" className="grid grid-cols-2 gap-2">
                      <Popover key="from-date">
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!filters.ngay_tao_tu && "text-slate-500"}`}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {filters.ngay_tao_tu ? format(new Date(filters.ngay_tao_tu), "dd/MM/yyyy") : "Từ ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={filters.ngay_tao_tu ? new Date(filters.ngay_tao_tu) : undefined}
                            onSelect={(date) => handleFilterChange('ngay_tao_tu', date ? date.toISOString() : '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover key="to-date">
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!filters.ngay_tao_den && "text-slate-500"}`}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {filters.ngay_tao_den ? format(new Date(filters.ngay_tao_den), "dd/MM/yyyy") : "Đến ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={filters.ngay_tao_den ? new Date(filters.ngay_tao_den) : undefined}
                            onSelect={(date) => handleFilterChange('ngay_tao_den', date ? date.toISOString() : '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )
                }
              ].map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <label key={`${filter.key}-label`} className="text-sm font-medium">{filter.label}</label>
                  {filter.content || (
                    <Select
                      key={`${filter.key}-select`}
                      value={filter.value}
                      onValueChange={filter.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={filter.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key={`${filter.key}-all`} value="all">Tất cả</SelectItem>
                        {filter.options?.map((option) => (
                          <SelectItem key={`${filter.key}-${option.key}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">STT</TableHead>
              <TableHead className="w-[100px]">Mã HĐ</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-center">Loại HĐ</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow key="loading">
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Đang tải...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow key="empty">
                <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                  Không tìm thấy hóa đơn nào
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => (
                <TableRow key={order.id_hoa_don}>
                  <TableCell key={`${order.id_hoa_don}-stt`} className="text-center text-slate-500">
                    {(pagination.trang_hien_tai - 1) * pagination.so_phan_tu_tren_trang + index + 1}
                  </TableCell>
                  <TableCell key={`${order.id_hoa_don}-code`} className="font-medium">{order.ma_hoa_don}</TableCell>
                  <TableCell key={`${order.id_hoa_don}-customer`}>
                    <div>
                      <p className="font-medium">{order.khachHang?.ten_khach_hang || 'Khách lẻ'}</p>
                      <p className="text-xs text-slate-500">{order.sdt_khach_hang || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell key={`${order.id_hoa_don}-date`}>{new Date(order.ngay_tao).toLocaleString("vi-VN")}</TableCell>
                  <TableCell key={`${order.id_hoa_don}-type`} className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.loai_hoa_don === 'TaiQuay' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {orderTypes[order.loai_hoa_don as keyof typeof orderTypes]}
                    </span>
                  </TableCell>
                  <TableCell key={`${order.id_hoa_don}-total`} className="text-right font-medium">
                    {formatCurrency(order.tong_tien_phai_thanh_toan)}
                  </TableCell>
                  <TableCell key={`${order.id_hoa_don}-status`} className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center w-fit mx-auto ${orderStatus[order.trang_thai as keyof typeof orderStatus]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {orderStatus[order.trang_thai as keyof typeof orderStatus]?.icon}
                      {orderStatus[order.trang_thai as keyof typeof orderStatus]?.label || order.trang_thai}
                    </span>
                  </TableCell>
                  <TableCell key={`${order.id_hoa_don}-actions`} className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex items-center gap-1"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Xem</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Phân trang */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-500">
            Hiển thị {orders.length} trên tổng số {pagination.tong_so_phan_tu} hóa đơn
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.trang_hien_tai - 1)}
              disabled={pagination.trang_hien_tai === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Trang {pagination.trang_hien_tai} / {pagination.tong_so_trang}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.trang_hien_tai + 1)}
              disabled={pagination.trang_hien_tai === pagination.tong_so_trang}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog xem chi tiết hóa đơn */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        {selectedOrder && (
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-blue-600" />
                  <DialogTitle className="text-2xl font-bold">Chi tiết hóa đơn</DialogTitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                      orderStatus[selectedOrder.trang_thai as keyof typeof orderStatus]?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {orderStatus[selectedOrder.trang_thai as keyof typeof orderStatus]?.icon}
                      {orderStatus[selectedOrder.trang_thai as keyof typeof orderStatus]?.label || selectedOrder.trang_thai}
                    </span>
                    {selectedOrder.loai_hoa_don === 'TaiQuay' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-center">
                        Hóa đơn tại quầy
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-semibold text-blue-600 flex items-center gap-1">
                    <FileText className="h-5 w-5" />
                    #{selectedOrder.ma_hoa_don}
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-8 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Thông tin khách hàng
                    </h3>
                    <div className="space-y-2">
                      <p className="font-medium text-lg flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-blue-600" />
                        {selectedOrder.khachHang?.ten_khach_hang || 'Khách lẻ'}
                      </p>
                      <p className="text-slate-600 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Mã KH:</span> {selectedOrder.khachHang?.ma_khach_hang || 'N/A'}
                      </p>
                      <p className="text-slate-600 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">SĐT:</span> {selectedOrder.sdt_khach_hang || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Thông tin hóa đơn
                    </h3>
                    <div className="space-y-2">
                      <p className="text-slate-600 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Ngày tạo:</span> {new Date(selectedOrder.ngay_tao).toLocaleString("vi-VN")}
                      </p>
                      <p className="text-slate-600">
                        <span className="flex items-center gap-2 mb-1">
                          <UserCircle className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">Nhân viên xử lý:</span>
                        </span>
                        <span className="pl-6 break-words">
                          {selectedOrder.ten_nguoi_xu_ly}
                          {selectedOrder.nhanVienXuLy?.ma_nhan_vien && (
                            <span className="text-xs text-slate-500 ml-1">({selectedOrder.nhanVienXuLy.ma_nhan_vien})</span>
                          )}
                        </span>
                      </p>
                      <p className="text-slate-600 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Phương thức:</span> {selectedOrder.ten_phuong_thuc_thanh_toan}
                      </p>
                      {selectedOrder.ghi_chu && (
                        <p className="text-slate-600 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">Ghi chú:</span> {selectedOrder.ghi_chu}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Sản phẩm
                  </h3>
                  <span className="text-sm text-slate-500">
                    Tổng số sản phẩm: {selectedOrder.hoaDonChiTiets?.reduce((sum, item) => sum + item.so_luong, 0) || 0}
                  </span>
                </div>
                <div className="border rounded-lg overflow-hidden border-slate-200">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10">
                      <TableRow>
                        <TableHead className="w-[40%]">Sản phẩm</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-center w-[100px]">SL</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.hoaDonChiTiets?.map((ct) => (
                        <TableRow key={ct.id_hoa_don_chi_tiet}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{ct.sanPhamChiTiet.ten_san_pham}</p>
                                <p className="text-xs text-slate-500">
                                  {ct.sanPhamChiTiet.ten_mau_sac} - {ct.sanPhamChiTiet.ten_kich_co}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              {ct.gia_sau_giam_gia < ct.don_gia ? (
                                <>
                                  <span className="text-slate-400 line-through text-sm">
                                    {formatCurrency(ct.don_gia)}
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    {formatCurrency(ct.gia_sau_giam_gia)}
                                  </span>
                                </>
                              ) : (
                                <span className="font-medium">
                                  {formatCurrency(ct.don_gia)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-medium">
                              {ct.so_luong}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(ct.thanh_tien)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tổng tiền */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-slate-400" />
                    Tổng tiền hàng:
                  </span>
                  <span>{formatCurrency(selectedOrder.tong_tien_don_hang)}</span>
                </div>
                {selectedOrder.so_tien_khuyen_mai > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Giảm giá:
                    </span>
                    <span>-{formatCurrency(selectedOrder.so_tien_khuyen_mai)}</span>
              </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Tổng thanh toán:
                  </span>
                  <span className="text-blue-600">{formatCurrency(selectedOrder.tong_tien_phai_thanh_toan)}</span>
                </div>
                {selectedOrder.so_tien_khach_tra > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        Tiền khách trả:
                      </span>
                      <span>{formatCurrency(selectedOrder.so_tien_khach_tra)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                        Tiền thối:
                      </span>
                      <span>{formatCurrency(selectedOrder.so_tien_thua_tra_khach)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 flex-shrink-0 border-t pt-4">
              <Button variant="outline" onClick={() => setIsViewOrderOpen(false)}>Đóng</Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                onClick={handlePrintInvoice}
              >
                <Printer className="h-4 w-4" />
                In hóa đơn
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog cho in hóa đơn */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>In hóa đơn</DialogTitle>
          </DialogHeader>
          {invoiceData && <InvoicePDF invoiceData={invoiceData} />}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `}</style>
    </AdminLayout>
  );
};

export default OrderListPage;
