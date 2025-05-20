"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Package2, 
  Calendar as CalendarIcon,
  CreditCard, 
  MapPin, 
  Clock,
  ChevronRight,
  ShoppingBag,
  Tag,
  DollarSign,
  Search,
  Filter,
  ArrowLeft,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Receipt,
  CircleDot,
  Circle,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";
import { hoaDonService } from "@/services/hoa-don.service";
import { HoaDonAdminDTO } from "@/types/hoa-don";
import { formatCurrency, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Định nghĩa interface cho trạng thái đơn hàng
interface OrderStatus {
  label: string;
  color: string;
  icon: JSX.Element;
  description: string;
  nextStatus?: string;
}

interface OrderStatuses {
  TatCa: string;
  DangChoXuLy: OrderStatus;
  DangChuanBi: OrderStatus;
  DangGiaoHang: OrderStatus;
  DaNhanHang: OrderStatus;
  HetHang: OrderStatus;
  DaThanhToan: OrderStatus;
  ChuaThanhToan: OrderStatus;
  DaHoanThanh: OrderStatus;
  DaHuy: OrderStatus;
  DaXacNhan: OrderStatus;
}

const orderStatuses: OrderStatuses = {
  TatCa: "Tất cả",
  DangChoXuLy: {
    label: "Đang chờ xử lý",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Clock className="h-4 w-4" />,
    description: "Đơn hàng của bạn đang chờ xác nhận",
    nextStatus: "DaXacNhan"
  },
  DaXacNhan: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <CheckCircle className="h-4 w-4" />,
    description: "Đơn hàng đã được xác nhận và sẽ được chuẩn bị",
    nextStatus: "DangChuanBi"
  },
  DangChuanBi: {
    label: "Đang chuẩn bị",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: <Package className="h-4 w-4" />,
    description: "Đơn hàng đang được chuẩn bị",
    nextStatus: "DangGiaoHang"
  },
  DangGiaoHang: {
    label: "Đang giao hàng",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: <Truck className="h-4 w-4" />,
    description: "Đơn hàng đang được vận chuyển",
    nextStatus: "DaNhanHang"
  },
  DaNhanHang: {
    label: "Đã nhận hàng",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="h-4 w-4" />,
    description: "Đơn hàng đã được giao và xác nhận nhận hàng",
    nextStatus: "DaHoanThanh"
  },
  HetHang: {
    label: "Hết hàng",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <AlertCircle className="h-4 w-4" />,
    description: "Một số sản phẩm trong đơn hàng đã hết hàng",
    nextStatus: "DaHuy"
  },
  DaThanhToan: {
    label: "Đã thanh toán",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="h-4 w-4" />,
    description: "Đơn hàng đã được thanh toán"
  },
  ChuaThanhToan: {
    label: "Chưa thanh toán",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: <AlertCircle className="h-4 w-4" />,
    description: "Đơn hàng chưa được thanh toán"
  },
  DaHoanThanh: {
    label: "Đã hoàn thành",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle className="h-4 w-4" />,
    description: "Đơn hàng đã được giao thành công"
  },
  DaHuy: {
    label: "Đã hủy",
    color: "bg-slate-100 text-slate-800 border-slate-200",
    icon: <XCircle className="h-4 w-4" />,
    description: "Đơn hàng đã bị hủy"
  }
};

// Tách thành component riêng để dễ quản lý
const CancelOrderDialog = ({
  isOpen,
  onClose,
  onConfirm,
  status,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  status: string;
  isLoading: boolean;
}) => {
  const [reason, setReason] = useState("");

  // Reset reason when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setReason("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do hủy đơn hàng");
      return;
    }
    onConfirm(reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
          <DialogDescription>
            {status === "ChuaThanhToan" 
              ? "Bạn có chắc chắn muốn hủy đơn hàng này? Đơn hàng sẽ không thể khôi phục sau khi hủy."
              : "Bạn có chắc chắn muốn hủy đơn hàng đang chờ xử lý này? Đơn hàng sẽ không thể khôi phục sau khi hủy."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 mb-4 space-y-2">
          <label htmlFor="cancellation-reason" className="text-sm font-medium text-foreground">
            Lý do hủy đơn*
          </label>
          <Textarea
            id="cancellation-reason"
            className="min-h-[120px] resize-none"
            placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isLoading}
            required
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Vui lòng cung cấp lý do hủy đơn để chúng tôi có thể cải thiện dịch vụ tốt hơn.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Không, giữ lại
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Có, hủy đơn hàng"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component hiển thị timeline trạng thái đơn hàng
const OrderTimeline = ({ 
  currentStatus,
  paymentMethod,
  isVNPay = false,
  orderId,
  onOrderCancel,
  cancelling = false
}: { 
  currentStatus: string;
  paymentMethod: string;
  isVNPay?: boolean;
  orderId: string;
  onOrderCancel: (reason: string) => void;
  cancelling?: boolean;
}) => {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handlePayment = () => {
    router.push(`/checkout?order_id=${orderId}`);
  };

  // Xác định các trạng thái cơ bản
  const baseStatuses = [
    "ChuaThanhToan",
    ...(isVNPay ? ["DaThanhToan"] : []),
    "DangChoXuLy",
    ...(currentStatus === "DaHuy" ? ["DaHuy"] : []),
    ...(currentStatus === "HetHang" ? ["HetHang"] : []),
    "DaXacNhan",
    "DangChuanBi",
    "DangGiaoHang",
    "DaNhanHang",
    "DaHoanThanh"
  ];

  // Lọc bỏ các trạng thái không cần thiết dựa vào trạng thái hiện tại
  const getFilteredStatuses = () => {
    const currentIndex = baseStatuses.indexOf(currentStatus);
    if (currentIndex === -1) return baseStatuses;

    // Nếu đơn hàng đã hủy hoặc hết hàng, chỉ hiển thị đến trạng thái đó
    if (currentStatus === "DaHuy" || currentStatus === "HetHang") {
      return baseStatuses.slice(0, currentIndex + 1);
    }

    // Nếu là VNPAY và chưa thanh toán, chỉ hiển thị đến Chờ thanh toán
    if (isVNPay && currentStatus === "ChuaThanhToan") {
      return baseStatuses.slice(0, 1);
    }

    return baseStatuses;
  };

  const orderFlow = getFilteredStatuses();
  const currentIndex = orderFlow.indexOf(currentStatus);

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-8 relative">
        {orderFlow.map((status, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const statusInfo = orderStatuses[status as keyof typeof orderStatuses] as OrderStatus;
          
          return (
            <div key={status} className="flex gap-4 items-start">
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center bg-background",
                isPast && "border-primary",
                isCurrent && "border-primary bg-primary/10",
                isFuture && "border-muted"
              )}>
                {isPast && <CheckCircle className="h-4 w-4 text-primary" />}
                {isCurrent && <CircleDot className="h-4 w-4 text-primary" />}
                {isFuture && <Circle className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium",
                    isPast && "text-primary",
                    isCurrent && "text-primary",
                    isFuture && "text-muted-foreground"
                  )}>
                    {statusInfo.label}
                  </p>
                  {isCurrent && (
                    <Badge className="text-xs bg-secondary text-secondary-foreground">
                      Hiện tại
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {statusInfo.description}
                </p>
                {status === "ChuaThanhToan" && isCurrent && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7 text-primary border-primary/20"
                      onClick={handlePayment}
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Thanh toán ngay
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Thêm nút hủy đơn cho trạng thái Chưa thanh toán và Đang chờ xử lý */}
      {(currentStatus === "ChuaThanhToan" || currentStatus === "DangChoXuLy") && (
        <div className="mt-8 pt-6 border-t space-y-4">
          {currentStatus === "ChuaThanhToan" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Thanh toán đơn hàng ngay
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận thanh toán</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn sẽ được chuyển đến trang thanh toán. Bạn có chắc chắn muốn tiếp tục?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePayment}>
                    Tiếp tục thanh toán
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Hủy đơn hàng
          </Button>

          <CancelOrderDialog
            isOpen={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={(reason) => {
              onOrderCancel(reason);
              setShowCancelDialog(false);
            }}
            status={currentStatus}
            isLoading={cancelling}
          />
        </div>
      )}
    </div>
  );
};

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<HoaDonAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<HoaDonAdminDTO | null>(null);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("TatCa");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const cancelReasonRef = useRef<HTMLTextAreaElement>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Add effect to focus textarea when dialog opens
  useEffect(() => {
    if (isAlertDialogOpen && cancelReasonRef.current) {
      // Slight delay to ensure dialog is fully rendered
      setTimeout(() => {
        cancelReasonRef.current?.focus();
      }, 100);
    }
  }, [isAlertDialogOpen]);

  // Hàm tải danh sách đơn hàng
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await hoaDonService.getHoaDonCuaKhachHang({
        trang_hien_tai: currentPage,
        so_phan_tu_tren_trang: 5,
        trang_thai: statusFilter === "TatCa" ? undefined : statusFilter,
        tim_kiem: searchTerm || undefined,
        ngay_tao_tu: startDate ? startDate.toISOString() : undefined,
        ngay_tao_den: endDate ? endDate.toISOString() : undefined,
      });
      setOrders(response.danh_sach);
      setTotalPages(response.tong_so_trang);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Thêm useEffect để theo dõi searchTerm với debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
      loadOrders();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Tách riêng useEffect cho các bộ lọc khác
  useEffect(() => {
    if (!searchTerm) { // Chỉ load khi không có tìm kiếm đang diễn ra
      loadOrders();
    }
  }, [statusFilter, currentPage, startDate, endDate]);

  // Sửa lại hàm handleResetFilters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("TatCa");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    loadOrders(); // Gọi ngay lập tức để tải lại danh sách
  };

  // Xem chi tiết đơn hàng
  const handleViewOrder = async (order: HoaDonAdminDTO) => {
    try {
      const orderDetail = await hoaDonService.getHoaDonByIdCuaKhachHang(order.id_hoa_don);
      setSelectedOrder(orderDetail);
      setIsViewOrderOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Không thể tải thông tin chi tiết đơn hàng");
    }
  };

  const handleCancelOrder = async (reason: string) => {
    if (!selectedOrder || cancelling) return;

    try {
      setCancelling(true);
      // Sử dụng API huyDonHangKhachHang thay vì huyDonHangChuaThanhToan
      const response = await hoaDonService.huyDonHangKhachHang(selectedOrder.id_hoa_don, reason);

      if (response) {
        toast.success(response.message || "Đã hủy đơn hàng thành công");
        
        // Tải lại thông tin đơn hàng để cập nhật trạng thái
        const updatedOrder = await hoaDonService.getHoaDonByIdCuaKhachHang(selectedOrder.id_hoa_don);
        
        // Cập nhật danh sách đơn hàng
        setOrders(orders.map(order => 
          order.id_hoa_don === selectedOrder.id_hoa_don 
            ? updatedOrder 
            : order
        ));
        
        // Cập nhật đơn hàng đang xem
        setSelectedOrder(updatedOrder);
      }
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast.error(error.response?.data?.message || "Không thể hủy đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang chủ
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý và theo dõi đơn hàng của bạn
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 w-[250px]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Xóa tìm kiếm"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Từ ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate || undefined}
                  onSelect={(date: Date | undefined) => {
                    setStartDate(date || null);
                    setCurrentPage(1);
                  }}
                  initialFocus
                  locale={vi}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Đến ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={(date: Date | undefined) => {
                    setEndDate(date || null);
                    setCurrentPage(1);
                  }}
                  initialFocus
                  locale={vi}
                  disabled={(date) =>
                    startDate ? date < startDate : false
                  }
                />
              </PopoverContent>
            </Popover>

            {(startDate || endDate || searchTerm || statusFilter !== "TatCa") && (
              <Button
                variant="ghost"
                className="h-8 px-2"
                onClick={handleResetFilters}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TatCa">Tất cả</SelectItem>
              {Object.entries(orderStatuses)
                .filter(([key]) => key !== 'TatCa')
                .map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {typeof value === 'object' && value.icon}
                      <span>{typeof value === 'object' ? value.label : value}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List or Empty State */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {searchTerm || statusFilter !== "TatCa" || startDate || endDate
                  ? "Không tìm thấy đơn hàng nào"
                  : "Chưa có đơn hàng nào"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {searchTerm || statusFilter !== "TatCa" || startDate || endDate
                  ? "Không tìm thấy đơn hàng nào phù hợp với điều kiện tìm kiếm."
                  : "Bạn chưa có đơn hàng nào. Hãy mua sắm để trải nghiệm dịch vụ của chúng tôi."}
              </p>
              {!searchTerm && statusFilter === "TatCa" && !startDate && !endDate && (
                <Button onClick={() => router.push("/")}>Mua sắm ngay</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Orders List */}
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card 
                key={order.id_hoa_don} 
                className="overflow-hidden hover:border-primary/20 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-medium truncate">
                          #{order.ma_hoa_don}
                        </h3>
                        {typeof orderStatuses[order.trang_thai as keyof typeof orderStatuses] === 'object' && (
                          <Badge className={`${(orderStatuses[order.trang_thai as keyof typeof orderStatuses] as { color: string }).color} flex items-center gap-1`}>
                            {(orderStatuses[order.trang_thai as keyof typeof orderStatuses] as { icon: JSX.Element }).icon}
                            {(orderStatuses[order.trang_thai as keyof typeof orderStatuses] as { label: string }).label}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {new Date(order.ngay_tao).toLocaleDateString("vi-VN")}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <CreditCard className="h-4 w-4 mr-2" />
                            {order.ten_phuong_thuc_thanh_toan}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="truncate">{order.dia_chi_nhan_hang}</span>
                          </div>
                          <div className="flex items-center text-sm font-medium">
                            <ShoppingBag className="h-4 w-4 mr-2 text-primary" />
                            {formatCurrency(order.tong_tien_phai_thanh_toan)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        onClick={() => handleViewOrder(order)}
                        className="w-full md:w-auto flex items-center gap-2"
                      >
                        Xem chi tiết
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                Chi tiết đơn hàng #{selectedOrder?.ma_hoa_don}
              </DialogTitle>
              {selectedOrder && typeof orderStatuses[selectedOrder.trang_thai as keyof typeof orderStatuses] === 'object' && (
                <Badge className={`${(orderStatuses[selectedOrder.trang_thai as keyof typeof orderStatuses] as { color: string }).color} flex items-center gap-1 px-3 py-1.5`}>
                  {(orderStatuses[selectedOrder.trang_thai as keyof typeof orderStatuses] as { icon: JSX.Element }).icon}
                  {(orderStatuses[selectedOrder.trang_thai as keyof typeof orderStatuses] as { label: string }).label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Cập nhật lần cuối: {selectedOrder && new Date(selectedOrder.ngay_tao).toLocaleString("vi-VN", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </p>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-6">
              {/* Main Content - Left Side (2 columns) */}
              <div className="md:col-span-2">
                {selectedOrder && (
                  <div className="space-y-8">
                    {/* Order Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            Thông tin đơn hàng
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Mã đơn</span>
                            <span className="font-medium">#{selectedOrder.ma_hoa_don}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Thời gian tạo</span>
                            <span>{new Date(selectedOrder.ngay_tao).toLocaleString("vi-VN", {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Phương thức thanh toán</span>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-primary" />
                              <span>{selectedOrder.ten_phuong_thuc_thanh_toan}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Thông tin giao hàng
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Người nhận</span>
                            <span className="font-medium">{selectedOrder.ten_khach_hang}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Số điện thoại</span>
                            <span>{selectedOrder.sdt_khach_hang}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-muted-foreground">Địa chỉ</span>
                              <Badge className="text-xs bg-secondary text-secondary-foreground">
                                Địa chỉ giao hàng
                              </Badge>
                            </div>
                            <p className="text-sm mt-1 text-right">{selectedOrder.dia_chi_nhan_hang}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Order Items */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-primary" />
                          Chi tiết sản phẩm
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedOrder.hoaDonChiTiets?.map((item) => (
                            <div
                              key={item.id_hoa_don_chi_tiet}
                              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{item.sanPhamChiTiet.ten_san_pham}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="text-xs bg-secondary text-secondary-foreground">
                                    {item.sanPhamChiTiet.ten_mau_sac}
                                  </Badge>
                                  <Badge className="text-xs bg-secondary text-secondary-foreground">
                                    {item.sanPhamChiTiet.ten_kich_co}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                    SL: {item.so_luong}
                                  </Badge>
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                    {formatCurrency(item.don_gia)} / SP
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-lg">{formatCurrency(item.thanh_tien)}</p>
                                {item.gia_sau_giam_gia < item.don_gia && (
                                  <p className="text-sm text-muted-foreground line-through">
                                    {formatCurrency(item.don_gia)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-6" />

                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-muted-foreground">Tổng tiền hàng</span>
                            <span>{formatCurrency(selectedOrder.tong_tien_don_hang)}</span>
                          </div>
                          {selectedOrder.so_tien_khuyen_mai > 0 && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 text-green-700">
                              <span className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Giảm giá
                              </span>
                              <span>-{formatCurrency(selectedOrder.so_tien_khuyen_mai)}</span>
                            </div>
                          )}
                          {(selectedOrder.phi_van_chuyen ?? 0) > 0 && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                              <span className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                Phí vận chuyển
                              </span>
                              <span>{formatCurrency(selectedOrder.phi_van_chuyen)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center p-4 rounded-lg bg-primary/5 border border-primary/10">
                            <span className="font-medium">Tổng thanh toán</span>
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(selectedOrder.tong_tien_phai_thanh_toan)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedOrder.ghi_chu && (
                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            Ghi chú
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">{selectedOrder.ghi_chu}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline - Right Side (1 column) */}
              <div className="md:border-l md:pl-6">
                <Card className="border-none shadow-none bg-transparent sticky top-0">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Trạng thái đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedOrder && selectedOrder.trang_thai !== "DaHuy" && selectedOrder.trang_thai !== "HetHang" && (
                      <OrderTimeline 
                        currentStatus={selectedOrder.trang_thai}
                        paymentMethod={selectedOrder.ten_phuong_thuc_thanh_toan}
                        isVNPay={selectedOrder.ten_phuong_thuc_thanh_toan.toLowerCase().includes('vnpay')}
                        orderId={selectedOrder.id_hoa_don}
                        onOrderCancel={handleCancelOrder}
                        cancelling={cancelling}
                      />
                    )}
                    {selectedOrder && (selectedOrder.trang_thai === "DaHuy") && (
                      <div className="flex items-center gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/10">
                        <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-destructive">
                            Đơn hàng đã bị hủy
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Đơn hàng này đã bị hủy và không thể tiếp tục xử lý
                          </p>
                          {selectedOrder.ly_do_huy_don_hang && (
                            <div className="mt-3 p-3 bg-slate-100 rounded-md">
                              <p className="text-xs font-medium text-slate-500 mb-1">Lý do hủy:</p>
                              <p className="text-sm">{selectedOrder.ly_do_huy_don_hang}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedOrder && (selectedOrder.trang_thai === "HetHang") && (
                     <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
  <div className="font-semibold mb-1 text-yellow-800 flex items-center gap-2">
    <AlertCircle className="h-5 w-5 text-yellow-600" />
    Đơn hàng đang chờ bổ sung hàng
  </div>
  <div className="text-sm text-yellow-700 mb-2">
    Một số sản phẩm trong đơn đã hết hàng. Dự kiến bổ sung hàng trong vòng 3-5 ngày làm việc. Bạn có thể đợi hoặc chủ động hủy đơn nếu không muốn chờ.
  </div>
  
  <Button
    variant="destructive"
    onClick={() => setShowCancelDialog(true)}
    disabled={cancelling}
  >
    {cancelling ? "Đang hủy..." : "Hủy đơn"}
  </Button>
  <CancelOrderDialog
    isOpen={showCancelDialog}
    onClose={() => setShowCancelDialog(false)}
    onConfirm={(reason) => {
      handleCancelOrder(reason);
      setShowCancelDialog(false);
    }}
    status={selectedOrder.trang_thai}
    isLoading={cancelling}
  />
</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
} 