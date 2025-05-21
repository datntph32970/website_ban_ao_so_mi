import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ShoppingCart, Plus, Minus, Trash, CreditCard, DollarSign, Printer, ChevronLeft, ChevronRight, X as CloseIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { MultiSelect } from '@/components/ui/multi-select';
import { Slider } from '@/components/ui/slider';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { HoaDonAdminDTO, HoaDonChiTietAdminDTO } from "@/types/hoa-don";
import { toast } from "react-hot-toast";
import { khuyenMaiService } from "@/services/khuyen-mai.service";
import { KhuyenMai } from "@/types/khuyen-mai";
import { hoaDonService } from '@/services/hoa-don.service';
import { phuongThucThanhToanService } from "@/services/phuong-thuc-thanh-toan.service";
import { useRouter } from 'next/navigation';
import { KhachHangAdminDTO } from "@/types/khach-hang";
import InvoicePDF from '@/components/invoice/InvoicePDF';
// ... import các type và service cần thiết ...

// Hàm format giá tiền
const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(Number(value));

// Hàm tính giá sau giảm cho 1 variant
function getDiscountedPrice(variant: any) {
  if (!variant.giamGia) return variant.gia_ban;
  if (variant.giamGia.kieu_giam_gia === 'PhanTram') {
    return Number((variant.gia_ban * (1 - variant.giamGia.gia_tri_giam / 100)).toFixed(2));
  }
  if (variant.giamGia.kieu_giam_gia === 'SoTien') {
    return Number((variant.gia_ban - variant.giamGia.gia_tri_giam).toFixed(2));
  }
  return variant.gia_ban;
}

interface OrderTabContentProps {
  order: any;
  onOrderChange: (order: any) => void;
  products: any[];
  customerOptions: any[];
  brands: any[];
  categories: any[];
  styles: any[];
  materials: any[];
  origins: any[];
  onSelectProduct: (product: any) => void;
  onAddToCart: (product: any, variantId?: number) => void;
  onUpdateCartItemQuantity: (id: string, id_san_pham_chi_tiet: string, newQuantity: number) => void;
  onDeleteOrderItem: (orderIndex: number, itemId: string) => void;
  onAddCustomer: (customer: any) => void;
  onPayment: () => void;
  onApplyFilter: () => void;
  onApplyDiscountCode: (code: string) => void;
  maxPrice: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
  onPaymentSuccess: () => void; // Thêm prop mới
  isCartUpdating?: boolean; // Thêm prop mới
}

export default function OrderTabContent({
  order,
  onOrderChange,
  products,
  customerOptions,
  brands,
  categories,
  styles,
  materials,
  origins,
  onSelectProduct,
  onAddToCart,
  onUpdateCartItemQuantity,
  onDeleteOrderItem,
  onAddCustomer,
  onPayment,
  onApplyFilter,
  onApplyDiscountCode,
  maxPrice,
  pagination,
  onPageChange,
  onPaymentSuccess,
  isCartUpdating
}: OrderTabContentProps) {
  const router = useRouter();
  const updateOrderField = (field: string, value: any) => {
    onOrderChange({ ...order, [field]: value });
  };
  
  // Tính toán tổng tiền từ hoaDonChiTiets
  const cartTotal = Array.isArray(order.hoaDonChiTiets)
    ? order.hoaDonChiTiets.reduce((total: number, item: any) => total + (item.thanh_tien || 0), 0)
    : 0;
  
  // Tính toán giá trị giảm giá
  const discountAmount = order.khuyenMai
    ? (order.khuyenMai.loai_khuyen_mai === 'PhanTram'
        ? Math.min(cartTotal * order.khuyenMai.gia_tri_khuyen_mai / 100, order.khuyenMai.gia_tri_giam_toi_da || Infinity)
        : Math.min(order.khuyenMai.gia_tri_khuyen_mai, cartTotal))
    : 0;

  const totalAmount = Math.max(0, cartTotal - discountAmount);

  // Format số tiền giảm giá để hiển thị
  const formatDiscountAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Thêm các state cục bộ cho dialog chi tiết sản phẩm
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);

  // State for promotions dialog
  const [isPromotionsDialogOpen, setIsPromotionsDialogOpen] = React.useState(false);
  const [promotions, setPromotions] = React.useState<{ khuyenMai: KhuyenMai, giaTriThucTe: number, giaTriHienThi: string }[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = React.useState(false);
  const [promotionSearch, setPromotionSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // New state for invoice printing dialog
  const [isPrintInvoiceOpen, setIsPrintInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Thêm state cho debounce
  const [customerCashDebounced, setCustomerCashDebounced] = useState<number | null>(null);
  const [paymentMethodDebouncedID, setPaymentMethodDebouncedID] = useState<string | null>(null);
  const [noteDebounced, setNoteDebounced] = useState<string | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);

  const [debouncedDiscountCode, setDebouncedDiscountCode] = useState<string | null>(null);

  // Thêm state tạm cho số lượng ở đầu component
  const [localQuantities, setLocalQuantities] = React.useState<{ [id: string]: number | '' }>({});

  React.useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedColor(null);
    setSelectedSize(null);
  }, [order.selectedProduct]);

  // Trigger parent search when customerSearch changes
  React.useEffect(() => {
    onOrderChange({ ...order });
  }, [order.customerSearch]);

  // Debounce searchTerm and call onApplyFilter
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onApplyFilter();
    }, 400);
    return () => clearTimeout(timeout);
  }, [order.searchTerm]);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(promotionSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [promotionSearch]);

  // Effect to fetch promotions when debounced search changes
  React.useEffect(() => {
    if (isPromotionsDialogOpen) {
      fetchActivePromotions();
    }
  }, [debouncedSearch, isPromotionsDialogOpen]);

  // Effect để cập nhật lại thông tin khuyến mãi khi quay lại tab
  React.useEffect(() => {
    // Chỉ gọi API khi có id_khuyen_mai và không phải đơn hàng mới
    if (order.khuyenMai?.id_khuyen_mai && !order.isNewOrder && order.currentOrderId) {
      // Thêm flag để kiểm tra xem có phải đang chuyển tab không
      const isTabChange = order.khuyenMai?.id_khuyen_mai !== order.discountCode;
      if (!isTabChange) {
        const timer = setTimeout(() => {
          onApplyDiscountCode(order.khuyenMai.id_khuyen_mai);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [order.khuyenMai?.id_khuyen_mai, order.isNewOrder, order.currentOrderId, order.discountCode]);

  // Effect để load thông tin khuyến mãi khi có mã
  React.useEffect(() => {
    const loadPromotionInfo = async () => {
      // Chỉ load khi có mã giảm giá, chưa có khuyến mãi và không phải đơn hàng mới
      if (order.discountCode && !order.khuyenMai && !order.isNewOrder && order.currentOrderId) {
        // Thêm flag để kiểm tra xem có phải đang chuyển tab không
        const isTabChange = order.discountCode !== order.khuyenMai?.ma_khuyen_mai;
        if (!isTabChange) {
          try {
            const res = await khuyenMaiService.getActivePromotions({ search: order.discountCode });
            const promotion = res.khuyen_mais.find(p => p.khuyenMai.ma_khuyen_mai === order.discountCode);
            if (promotion) {
              const km = promotion.khuyenMai;
              onOrderChange({
                ...order,
                khuyenMai: {
                  id_khuyen_mai: km.id_khuyen_mai,
                  ten_khuyen_mai: km.ten_khuyen_mai,
                  ma_khuyen_mai: km.ma_khuyen_mai,
                  loai_khuyen_mai: km.kieu_khuyen_mai,
                  gia_tri_khuyen_mai: km.gia_tri_giam,
                  gia_tri_giam_toi_da: km.gia_tri_giam_toi_da
                },
                so_tien_khuyen_mai: promotion.giaTriThucTe,
                discountAmount: promotion.giaTriThucTe,
                tong_tien_phai_thanh_toan: Math.max(0, cartTotal - promotion.giaTriThucTe)
              });
            }
          } catch (error) {
            console.error('Error loading promotion info:', error);
          }
        }
      }
    };
    loadPromotionInfo();
  }, [order.discountCode, order.isNewOrder, order.currentOrderId, order.khuyenMai?.ma_khuyen_mai]);

  // Effect để lấy danh sách phương thức thanh toán
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setIsLoadingPaymentMethods(true);
        const data = await phuongThucThanhToanService.getDanhSachPhuongThucThanhToanHoatDong();
        setPaymentMethods(data);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        toast.error('Không thể tải danh sách phương thức thanh toán');
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };

    if (order.isPaymentOpen) {
      fetchPaymentMethods();
    }
  }, [order.isPaymentOpen]);

  // Effect để debounce phương thức thanh toán
  useEffect(() => {
    if (order.paymentMethodID && order.paymentMethodID !== paymentMethodDebouncedID) {
      const timer = setTimeout(() => {
        setPaymentMethodDebouncedID(order.paymentMethodID);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [order.paymentMethodID]);

  // Effect để debounce ghi chú
  useEffect(() => {
    if (order.note !== undefined && order.note !== noteDebounced) {
      const timer = setTimeout(() => {
        setNoteDebounced(order.note);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [order.note]);

  // Effect để gọi API khi phương thức thanh toán hoặc ghi chú thay đổi
  useEffect(() => {
    const updateOrder = async () => {
      if ((paymentMethodDebouncedID || noteDebounced) && order.currentOrderId) {
        try {
          const selectedMethod = paymentMethods.find(m => m.id_phuong_thuc_thanh_toan === paymentMethodDebouncedID);
                  const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);

          if (!selectedMethod) return;

          await hoaDonService.updateHoaDon({
            id_hoa_don: order.currentOrderId,
            id_khach_hang: invoice.khachHang?.id_khach_hang,
            id_khuyen_mai: invoice.khuyenMai?.id_khuyen_mai,
            id_phuong_thuc_thanh_toan: selectedMethod.id_phuong_thuc_thanh_toan,
            ghi_chu: noteDebounced || undefined,
            so_tien_khach_tra: 0
          });
        } catch (error) {
          console.error('Error updating order:', error);
          toast.error('Không thể cập nhật thông tin hóa đơn');
        }
      }
    };

    updateOrder();
  }, [paymentMethodDebouncedID, noteDebounced, order.currentOrderId, paymentMethods]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  let images = (
    order.selectedProduct?.variants?.flatMap((v: any) =>
      Array.isArray(v.hinhAnhSanPhamChiTiets)
        ? v.hinhAnhSanPhamChiTiets
            .map((img: any) =>
              img.hinh_anh_urls
                ? (img.hinh_anh_urls.startsWith('/') ? API_URL + img.hinh_anh_urls : img.hinh_anh_urls)
                : null
            )
            .filter(Boolean)
        : []
    ) ?? []
  ) as string[];
  if (order.selectedProduct?.imageUrl) images.unshift(order.selectedProduct.imageUrl);
  // Lọc trùng theo tên file
  images = images.filter((url, idx, arr) => {
    const name = url.split('/').pop();
    return arr.findIndex(u => u.split('/').pop() === name) === idx;
  });

  const colors = Array.from(new Set(order.selectedProduct?.variants?.map((v: any) => v.color) ?? [])) as string[];
  const sizes = selectedColor
    ? (order.selectedProduct?.variants?.filter((v: any) => v.color === selectedColor).map((v: any) => v.size) ?? []) as string[]
    : [];

  // Function to fetch active promotions
  const fetchActivePromotions = async () => {
    try {
      setIsLoadingPromotions(true);
      const res = await khuyenMaiService.getActivePromotions({ search: debouncedSearch });
      setPromotions(res.khuyen_mais);
    } catch (error) {
      toast.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setIsLoadingPromotions(false);
    }
  };

  // Function to handle opening promotions dialog
  const handleOpenPromotionsDialog = async () => {
    setIsPromotionsDialogOpen(true);
    setPromotionSearch("");
    setDebouncedSearch("");
  };

  // Function to handle search promotions
  const handleSearchPromotions = (value: string) => {
    setPromotionSearch(value);
  };

  // Function to handle selecting a promotion
  const handleSelectPromotion = async (promotion: { khuyenMai: KhuyenMai, giaTriThucTe: number, giaTriHienThi: string }) => {
    const km = promotion.khuyenMai;
    if (km.ma_khuyen_mai) {
      // Gọi API để cập nhật server
      await onApplyDiscountCode(km.id_khuyen_mai);
      // Lấy lại hóa đơn mới nhất từ server
      if (order.currentOrderId) {
        const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
        onOrderChange({
          ...order,
          hoaDonChiTiets: invoice.hoaDonChiTiets,
          so_tien_khuyen_mai: invoice.so_tien_khuyen_mai,
          tong_tien_phai_thanh_toan: invoice.tong_tien_phai_thanh_toan,
          khuyenMai: invoice.khuyenMai,
          discountCode: invoice.khuyenMai?.ma_khuyen_mai || '',
          discountAmount: invoice.so_tien_khuyen_mai || 0
        });
        console.log('Giỏ hàng sau khi áp mã khuyến mại:', invoice.hoaDonChiTiets || order.cart);
      }
    }
    setIsPromotionsDialogOpen(false);
  };

  // Function to handle updating cart item quantity
  const handleUpdateQuantity = (id_hoa_don_chi_tiet: string, id_san_pham_chi_tiet: string, newQuantity: number) => {
    onUpdateCartItemQuantity(id_hoa_don_chi_tiet, id_san_pham_chi_tiet, newQuantity);
  };

  // Function to handle adding to cart
  const handleAddToCart = async (variant: any) => {
    // Optimistic update: add item to cart immediately
    const newItem = {
      id: Date.now().toString(),
      id_san_pham_chi_tiet: variant.id_san_pham_chi_tiet,
      name: order.selectedProduct?.name,
      price: getDiscountedPrice(variant),
      originalPrice: variant.gia_ban,
      quantity: 1,
      total: getDiscountedPrice(variant),
      color: variant.color,
      size: variant.size
    };
    onOrderChange({
      ...order,
      cart: [...(order.cart || []), newItem]
    });
    // Then call parent to sync with server
    await onAddToCart(variant);
  };

  // Function to handle payment button click
  const handlePayment = async () => {
    if (!order.hoaDonChiTiets || order.hoaDonChiTiets.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }
    try {
      setIsPaymentLoading(true);
      // Gọi API lấy hóa đơn mới nhất
      const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
      // Chỉ cập nhật thông tin hóa đơn mà không thay đổi khách hàng
      onOrderChange({
        ...order,
        hoaDonChiTiets: invoice.hoaDonChiTiets,
        discountCode: invoice.khuyenMai?.ma_khuyen_mai || '',
        discountAmount: invoice.so_tien_khuyen_mai || 0
      });
      updateOrderField('isPaymentOpen', true);
    } catch (error) {
      toast.error('Không thể tải thông tin hóa đơn mới nhất');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // Effect để debounce số tiền khách đưa
  useEffect(() => {
    if (order.customerCash !== undefined) {
      const timer = setTimeout(() => {
        setCustomerCashDebounced(order.customerCash);
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }
  }, [order.customerCash]);

  // Effect để gọi API khi số tiền khách đưa thay đổi
  useEffect(() => {
    const updateCustomerCash = async () => {
      if (customerCashDebounced !== null && order.currentOrderId) {
        try {
          const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);

          await hoaDonService.updateHoaDon({
            id_hoa_don: order.currentOrderId,
            id_khach_hang: invoice.khachHang?.id_khach_hang,
            id_khuyen_mai: invoice.khuyenMai?.id_khuyen_mai,
            ghi_chu: invoice.ghi_chu,
            id_phuong_thuc_thanh_toan: invoice.id_phuong_thuc_thanh_toan,
            so_tien_khach_tra: customerCashDebounced
          });
        } catch (error) {
          console.error('Error updating customer cash:', error);
        }
      }
    };

    updateCustomerCash();
  }, [customerCashDebounced, order.currentOrderId]);

  // Effect để debounce mã khuyến mãi
  useEffect(() => {
    if (order.discountCode !== undefined) {
      const timer = setTimeout(() => {
        setDebouncedDiscountCode(order.discountCode);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [order.discountCode]);

  // Effect để tự động áp dụng mã khuyến mãi khi người dùng nhập
  useEffect(() => {
    const applyDiscountCode = async () => {
      // Chỉ áp dụng khi có mã giảm giá và không phải đơn hàng mới
      if (debouncedDiscountCode !== null && !order.isNewOrder && order.currentOrderId) {
        // Thêm flag để kiểm tra xem có phải đang chuyển tab không
        const isTabChange = debouncedDiscountCode !== order.khuyenMai?.ma_khuyen_mai;
        if (!isTabChange) {
          try {
            const res = await khuyenMaiService.getActivePromotions({ search: debouncedDiscountCode });
            const promotion = res.khuyen_mais.find(p => p.khuyenMai.ma_khuyen_mai === debouncedDiscountCode);
            if (promotion) {
              const km = promotion.khuyenMai;
              await onApplyDiscountCode(km.id_khuyen_mai);
              // Lấy lại hóa đơn mới nhất từ server
              if (order.currentOrderId) {
                const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
                onOrderChange({
                  ...order,
                  hoaDonChiTiets: invoice.hoaDonChiTiets,
                  so_tien_khuyen_mai: invoice.so_tien_khuyen_mai,
                  tong_tien_phai_thanh_toan: invoice.tong_tien_phai_thanh_toan,
                  khuyenMai: invoice.khuyenMai,
                  discountCode: invoice.khuyenMai?.ma_khuyen_mai || '',
                  discountAmount: invoice.so_tien_khuyen_mai || 0
                });
              }
              toast.success(
                `Đã áp dụng mã "${km.ma_khuyen_mai}" - ${promotion.giaTriHienThi}`
              );
            } else if (debouncedDiscountCode !== '') {
              toast.error('Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
              onOrderChange({
                ...order,
                khuyenMai: undefined,
                so_tien_khuyen_mai: 0,
                discountAmount: 0,
                tong_tien_phai_thanh_toan: cartTotal
              });
              onApplyDiscountCode('');
            }
          } catch (error) {
            console.error('Error applying discount code:', error);
            toast.error('Không thể áp dụng mã khuyến mãi');
          }
        }
      }
    };
    applyDiscountCode();
  }, [debouncedDiscountCode, cartTotal, order.isNewOrder, order.currentOrderId, order.khuyenMai?.ma_khuyen_mai]);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Tìm kiếm, lọc, danh sách sản phẩm */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tìm kiếm và lọc sản phẩm */}
          <div className="flex space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                className="pl-10"
                placeholder="Tìm kiếm sản phẩm..."
                value={order.searchTerm || ''}
                onChange={e => updateOrderField('searchTerm', e.target.value)}
                name="search-product"
                autoComplete="off"
              />
              {order.searchTerm && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => updateOrderField('searchTerm', '')}
                  tabIndex={-1}
                  aria-label="Xóa tìm kiếm"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button variant="outline" onClick={() => updateOrderField('isFilterOpen', true)}>Lọc</Button>
          </div>
          {/* Danh sách sản phẩm */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {!products || products.length === 0 ? (
              <div className="col-span-3 text-center py-10 text-slate-400">Chưa có dữ liệu sản phẩm</div>
            ) : (
              products.map((product, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => onSelectProduct(product)}
                >
                  <CardContent className="p-4">
                    <div className="h-32 bg-slate-100 rounded-md mb-3 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="object-contain h-32 w-full"
                          style={{ maxHeight: 128 }}
                        />
                      ) : (
                        <div className="font-bold text-slate-400">Ảnh</div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-slate-500 mb-1">Mã: {product.code}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-slate-500 text-xs">{product.category}</p>
                      <div className="text-right">
                        {product.discountInfo ? (
                          <>
                            <div className="text-sm font-bold text-green-600">
                              {product.minPrice === product.maxPrice
                                ? formatCurrency(product.minPrice ?? 0)
                                : `${formatCurrency(product.minPrice ?? 0)} - ${formatCurrency(product.maxPrice ?? 0)}`}
                            </div>
                            <div className="text-xs text-slate-400 line-through">
                              {product.minOriginPrice === product.maxOriginPrice
                                ? formatCurrency(product.minOriginPrice ?? 0)
                                : `${formatCurrency(product.minOriginPrice ?? 0)} - ${formatCurrency(product.maxOriginPrice ?? 0)}`}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-blue-600">
                            {product.minPrice === product.maxPrice
                              ? formatCurrency(product.minPrice ?? 0)
                              : `${formatCurrency(product.minPrice ?? 0)} - ${formatCurrency(product.maxPrice ?? 0)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Phân trang */}
          {products && products.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Trang sau
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Hiển thị <span className="font-medium">{((pagination.currentPage - 1) * pagination.pageSize) + 1}</span> đến{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
                    </span>{' '}
                    của <span className="font-medium">{pagination.totalItems}</span> kết quả
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <Button
                      variant="outline"
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"
                      onClick={() => onPageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      <span className="sr-only">Trang trước</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </Button>
                    
                    {/* Hiển thị các số trang */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === pagination.currentPage
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0'
                        }`}
                        onClick={() => onPageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"
                      onClick={() => onPageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      <span className="sr-only">Trang sau</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Cột phải: Tìm kiếm khách hàng, giỏ hàng */}
        <div className="lg:col-span-1">
          {/* Tìm kiếm khách hàng */}
          <div className="mb-4">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Tìm tên hoặc số điện thoại khách hàng..."
                    value={order.customerSearch || ''}
                    onChange={e => updateOrderField('customerSearch', e.target.value)}
                    name="search-customer"
                    autoComplete="off"
                    disabled={!!order.selectedCustomer}
                  />
                  {order.customerSearch && !order.selectedCustomer && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => updateOrderField('customerSearch', '')}
                      tabIndex={-1}
                      aria-label="Xóa tìm kiếm"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  )}
                  {order.customerSearch && !order.selectedCustomer && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-20 max-h-56 overflow-y-auto scrollbar-hide">
                      {customerOptions.length > 0 ? (
                        customerOptions.map((kh, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                            onClick={() => onOrderChange({
                              ...order,
                              selectedCustomer: kh,
                              customerSearch: ''
                            })}
                          >
                            <span className="font-medium">{kh.ten_khach_hang}</span>
                            <span className="text-xs text-slate-500">({kh.so_dien_thoai})</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-slate-400 text-sm">Không tìm thấy khách hàng</div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => updateOrderField('isAddCustomerOpen', true)}
                  disabled={!!order.selectedCustomer}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm
                </Button>
              </div>
              {order.selectedCustomer && (
                <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="flex-1">
                    <div className="font-semibold">{order.selectedCustomer.ten_khach_hang}</div>
                    <div className="text-xs text-slate-500">SĐT: {order.selectedCustomer.so_dien_thoai}</div>
                  </div>
                  <button
                    className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs border border-blue-200"
                    onClick={() => updateOrderField('selectedCustomer', null)}
                  >
                    Đổi khách
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Giỏ hàng */}
          <Card className="sticky top-[80px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Giỏ hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Spinner overlay khi đang cập nhật cart */}
              {isCartUpdating && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              )}
              <div className="space-y-4">
                {(!order.hoaDonChiTiets?.length && !order.cart?.length) ? (
                  <div className="text-center py-6 text-slate-500">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p>Giỏ hàng trống</p>
                    <p className="text-xs mt-1">Chọn sản phẩm để thêm vào giỏ hàng</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[400px] overflow-y-auto space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {Array.isArray(order.hoaDonChiTiets) && order.hoaDonChiTiets.length > 0 ? (
                        order.hoaDonChiTiets.map((item: any, index: number) => (
                          <div key={index} className="flex items-center border-b border-slate-100 pb-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.sanPhamChiTiet.ten_san_pham}</p>
                              {(item.sanPhamChiTiet.ten_mau_sac || item.sanPhamChiTiet.ten_kich_co) && (
                                <p className="text-xs text-slate-500">
                                  {[item.sanPhamChiTiet.ten_mau_sac, item.sanPhamChiTiet.ten_kich_co].filter(Boolean).join(' - ')}
                                </p>
                              )}
                              {item.don_gia > item.gia_sau_giam_gia ? (
                                <>
                                  <span className="text-green-600 font-bold text-sm mr-2">
                                    {formatCurrency(item.gia_sau_giam_gia)}
                                  </span>
                                  <span className="text-xs text-slate-400 line-through">
                                    {formatCurrency(item.don_gia)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-bold text-blue-600">
                                  {formatCurrency(item.don_gia)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => {
                                handleUpdateQuantity(item.id_hoa_don_chi_tiet, item.id_san_pham_chi_tiet, item.so_luong - 1);
                              }}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                className="w-16 h-7 text-center"
                                value={(localQuantities[item.id_hoa_don_chi_tiet] ?? item.so_luong) || ''}
                                onChange={e => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value)) {
                                    setLocalQuantities(q => ({
                                      ...q,
                                      [item.id_hoa_don_chi_tiet]: value === '' ? '' : parseInt(value)
                                    }));
                                  }
                                }}
                                onBlur={e => {
                                  const newQuantity = parseInt(e.target.value) || 0;
                                  if (newQuantity > 0 && newQuantity !== item.so_luong) {
                                    handleUpdateQuantity(item.id_hoa_don_chi_tiet, item.id_san_pham_chi_tiet, newQuantity);
                                  }
                                  // Xóa state tạm sau khi cập nhật
                                  setLocalQuantities(q => {
                                    const { [item.id_hoa_don_chi_tiet]: _, ...rest } = q;
                                    return rest;
                                  });
                                }}
                              />
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => {
                                handleUpdateQuantity(item.id_hoa_don_chi_tiet, item.id_san_pham_chi_tiet, item.so_luong + 1);
                              }}>
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => {
                                handleUpdateQuantity(item.id_hoa_don_chi_tiet, item.id_san_pham_chi_tiet, 0);
                              }}>
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="ml-4 w-20 text-right">
                              <p className="font-bold text-sm">{formatCurrency(item.thanh_tien)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-500">
                          <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p>Giỏ hàng trống</p>
                          <p className="text-xs mt-1">Chọn sản phẩm để thêm vào giỏ hàng</p>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Tổng tiền hàng</span>
                        <span className="font-medium">{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            type="text"
                            value={order.discountCode || ""}
                            onChange={(e) => updateOrderField('discountCode', e.target.value)}
                            placeholder="Nhập mã khuyến mãi"
                            name="discountCode"
                            className="pr-32"
                          />
                          {order.khuyenMai && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600">
                              {order.khuyenMai.loai_khuyen_mai === 'PhanTram' ? (
                                <>
                                  {order.khuyenMai.gia_tri_khuyen_mai}% <span className="text-slate-500">(Tối đa: {formatCurrency(order.khuyenMai.gia_tri_giam_toi_da)})</span>
                                </>
                              ) : (
                                formatDiscountAmount(order.khuyenMai.gia_tri_khuyen_mai)
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleOpenPromotionsDialog}
                          title="Chọn mã khuyến mãi"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        {order.discountCode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // Cập nhật state ngay lập tức
                              onOrderChange({
                                ...order,
                                discountCode: '',
                                khuyenMai: undefined,
                                so_tien_khuyen_mai: 0,
                                discountAmount: 0,
                                tong_tien_phai_thanh_toan: cartTotal
                              });
                              // Sau đó gọi API để cập nhật server
                              onApplyDiscountCode('');
                            }}
                            title="Xóa mã giảm giá"
                          >
                            <CloseIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Giảm giá</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-bold">Tổng thanh toán</span>
                        <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1">Hủy</Button>
                      <Button 
                        className="flex-1" 
                        onClick={handlePayment}
                        disabled={!order.hoaDonChiTiets || order.hoaDonChiTiets.length === 0 || isPaymentLoading}
                      >
                        {isPaymentLoading ? 'Đang tải...' : 'Thanh toán'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog filter */}
      <Dialog open={order.isFilterOpen} onOpenChange={value => updateOrderField('isFilterOpen', value)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lọc sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Thương hiệu</label>
                <MultiSelect
                  options={brands.map(b => ({ label: b.ten_thuong_hieu || b.name, value: String(b.id_thuong_hieu || b.id) }))}
                  values={order.selectedBrandIds}
                  onChange={values => updateOrderField('selectedBrandIds', values)}
                  placeholder="Chọn thương hiệu..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Danh mục</label>
                <MultiSelect
                  options={categories.map(c => ({ label: c.ten_danh_muc || c.name, value: String(c.id_danh_muc || c.id) }))}
                  values={order.selectedCategoryIds}
                  onChange={values => updateOrderField('selectedCategoryIds', values)}
                  placeholder="Chọn danh mục..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kiểu dáng</label>
                <MultiSelect
                  options={styles.map(s => ({ label: s.ten_kieu_dang || s.name, value: String(s.id_kieu_dang || s.id) }))}
                  values={order.selectedStyleIds}
                  onChange={values => updateOrderField('selectedStyleIds', values)}
                  placeholder="Chọn kiểu dáng..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chất liệu</label>
                <MultiSelect
                  options={materials.map(m => ({ label: m.ten_chat_lieu || m.name, value: String(m.id_chat_lieu || m.id) }))}
                  values={order.selectedMaterialIds}
                  onChange={values => updateOrderField('selectedMaterialIds', values)}
                  placeholder="Chọn chất liệu..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Xuất xứ</label>
                <MultiSelect
                  options={origins.map(o => ({ label: o.ten_xuat_xu || o.name, value: String(o.id_xuat_xu || o.id) }))}
                  values={order.selectedOriginIds}
                  onChange={values => updateOrderField('selectedOriginIds', values)}
                  placeholder="Chọn xuất xứ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Khoảng giá</label>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={10000}
                  value={order.priceRange}
                  onValueChange={values => updateOrderField('priceRange', values)}
                />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>{(order.priceRange?.[0] ?? 0).toLocaleString('vi-VN')}₫</span>
                  <span>{(order.priceRange?.[1] ?? 0).toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t">
              <Button 
                className="w-full" 
                onClick={() => {
                  onApplyFilter();
                  updateOrderField('isFilterOpen', false);
                }}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog thanh toán */}
      <Dialog open={order.isPaymentOpen} onOpenChange={async (value) => {
        if (value) {
          try {
            // Gọi API lấy thông tin hóa đơn khi mở dialog
            const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
            onOrderChange({
              ...order,
              paymentMethodID: invoice.id_phuong_thuc_thanh_toan || '',
              note: invoice.ghi_chu || '',
              customerCash: 0, // Reset customer cash when opening dialog
              isPaymentOpen: true
            });
          } catch (error) {
            console.error('Error fetching invoice details:', error);
            toast.error('Không thể tải thông tin hóa đơn');
          }
        } else {
          updateOrderField('isPaymentOpen', false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Thanh toán đơn hàng</DialogTitle>
            <DialogDescription>Vui lòng kiểm tra thông tin và chọn phương thức thanh toán</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Thông tin khách hàng */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Thông tin khách hàng</h3>
              {order.selectedCustomer ? (
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Tên:</span> {order.selectedCustomer.ten_khach_hang}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">SĐT:</span> {order.selectedCustomer.so_dien_thoai}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Khách lẻ</p>
              )}
            </div>

            {/* Chi tiết đơn hàng */}
            <div>
              <h3 className="font-medium mb-2">Chi tiết đơn hàng</h3>
              <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {Array.isArray(order.hoaDonChiTiets) && order.hoaDonChiTiets.length > 0 ? (
                  order.hoaDonChiTiets.map((item: any, index: number) => (
                    <div key={index} className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.sanPhamChiTiet?.ten_san_pham || item.ten_san_pham}</p>
                        <p className="text-xs text-slate-500">
                          {item.so_luong} x {formatCurrency(item.gia_sau_giam_gia)}
                        </p>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(item.thanh_tien)}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-6">Không có sản phẩm nào trong hóa đơn</div>
                )}
              </div>
            </div>

            {/* Tổng tiền và giảm giá */}
            <div className="space-y-2">
              {cartTotal > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Tổng tiền hàng</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Tổng thanh toán</span>
                    <span className="text-lg">{formatCurrency(totalAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1">Hủy</Button>
                <Button 
                  className="flex-1" 
                  onClick={handlePayment}
                  disabled={!order.hoaDonChiTiets || order.hoaDonChiTiets.length === 0 || isPaymentLoading}
                >
                  {isPaymentLoading ? 'Đang tải...' : 'Thanh toán'}
                </Button>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="space-y-3">
              <h3 className="font-medium">Phương thức thanh toán</h3>
              {isLoadingPaymentMethods ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id_phuong_thuc_thanh_toan}
                      className={`p-3 border rounded-lg flex items-center gap-2 transition-all ${
                        order.paymentMethod === method.id_phuong_thuc_thanh_toan
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                      onClick={() => updateOrderField('paymentMethodID', method.id_phuong_thuc_thanh_toan)}
                    >
                      <div className={`p-2 rounded-full ${
                        order.paymentMethodID === method.id_phuong_thuc_thanh_toan ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        {method.ma_phuong_thuc_thanh_toan === 'cash' ? (
                          <DollarSign className={`h-5 w-5 ${
                            order.paymentMethodID === method.id_phuong_thuc_thanh_toan ? 'text-blue-600' : 'text-slate-600'
                          }`} />
                        ) : (
                          <CreditCard className={`h-5 w-5 ${
                            order.paymentMethodID === method.id_phuong_thuc_thanh_toan ? 'text-blue-600' : 'text-slate-600'
                          }`} />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{method.ten_phuong_thuc_thanh_toan}</p>
                        <p className="text-xs text-slate-500">{method.mo_ta}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-medium mb-2">Ghi chú</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
                placeholder="Nhập ghi chú cho đơn hàng (nếu có)"
                value={order.note || ''}
                onChange={(e) => updateOrderField('note', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => updateOrderField('isPaymentOpen', false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                try {
                  // Lấy thông tin chi tiết hóa đơn
                  const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
                  // Tìm phương thức thanh toán được chọn
                  const selectedMethod = paymentMethods.find(m => m.id_phuong_thuc_thanh_toan === order.paymentMethodID);
                  
                  if (selectedMethod?.id_phuong_thuc_thanh_toan === invoice.ten_phuong_thuc_thanh_toan) {
                    // Nếu là thanh toán tiền mặt, mở dialog nhập tiền
                    setIsConfirmPaymentOpen(true);
                  } else {
                    // Nếu là thanh toán khác, mở dialog xác nhận
                    setIsConfirmPaymentOpen(true);
                  }
                } catch (error) {
                  console.error('Error fetching invoice details:', error);
                  toast.error('Không thể tải thông tin hóa đơn');
                }
              }}
              disabled={!order.paymentMethodID}
            >
              {!order.paymentMethodID ? 'Vui lòng chọn phương thức thanh toán' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thêm khách hàng mới */}
      <Dialog open={order.isAddCustomerOpen} onOpenChange={value => updateOrderField('isAddCustomerOpen', value)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Tên khách hàng</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={order.newCustomer.ten_khach_hang}
                onChange={e => {
                  console.log('Tên khách hàng:', e.target.value);
                  const newCustomer = { ...order.newCustomer, ten_khach_hang: e.target.value };
                  console.log('newCustomer sau khi cập nhật:', newCustomer);
                  updateOrderField('newCustomer', newCustomer);
                }}
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={order.newCustomer.so_dien_thoai}
                onChange={e => {
                  console.log('Số điện thoại:', e.target.value);
                  const newCustomer = { ...order.newCustomer, so_dien_thoai: e.target.value };
                  console.log('newCustomer sau khi cập nhật:', newCustomer);
                  updateOrderField('newCustomer', newCustomer);
                }}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => updateOrderField('isAddCustomerOpen', false)}>Hủy</Button>
            <Button 
              onClick={() => {
                console.log('Dữ liệu khách hàng trước khi thêm:', order.newCustomer);
                onAddCustomer(order.newCustomer);
              }}
              disabled={!order.newCustomer.ten_khach_hang || !order.newCustomer.so_dien_thoai}
            >
              {order.isLoadingCustomer ? 'Đang thêm...' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog chi tiết sản phẩm */}
      <Dialog open={!!order.selectedProduct} onOpenChange={() => {
        updateOrderField('selectedProduct', null);
      }}>
        <DialogContent className="max-w-4xl">
          {order.isProductDetailLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết sản phẩm</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cột trái: Hình ảnh sản phẩm */}
                <div className="space-y-4">
                  {/* Ảnh chính */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                    {images[currentImageIndex] ? (
                      <img
                        src={images[currentImageIndex]}
                        alt={order.selectedProduct?.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <span>Không có ảnh</span>
                      </div>
                    )}
                    {/* Nút chuyển ảnh */}
                    {images.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                          onClick={() => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                          title="Ảnh trước"
                          aria-label="Xem ảnh trước"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                          onClick={() => setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                          title="Ảnh sau"
                          aria-label="Xem ảnh sau"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Cột phải: Thông tin sản phẩm */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{order.selectedProduct?.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Mã: {order.selectedProduct?.code}</span>
                      <span>•</span>
                      <span>{order.selectedProduct?.category}</span>
                      {order.selectedProduct?.brand && (
                        <>
                          <span>•</span>
                          <span>{order.selectedProduct?.brand}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Màu sắc</h3>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color: string, idx: number) => (
                          <button
                            key={idx}
                            className={`px-4 py-2 rounded-full border ${
                              selectedColor === color
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                            onClick={() => setSelectedColor(color)}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedColor && (
                      <div>
                        <h3 className="font-medium mb-2">Kích thước</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {sizes.map((size: string, idx: number) => {
                            const variant = order.selectedProduct?.variants.find(
                              (v: any) => v.color === selectedColor && v.size === size
                            );
                            const isOutOfStock = !variant?.stock;
                            return (
                              <div key={idx} className="flex flex-col items-center">
                            <button
                                  className={`w-full p-2 rounded-lg border transition-all ${
                                selectedSize === size
                                      ? 'border-blue-500 bg-blue-50'
                                  : 'border-slate-200 hover:border-blue-300'
                                  } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  onClick={() => !isOutOfStock && setSelectedSize(size)}
                                  disabled={isOutOfStock}
                            >
                                  <span className="font-medium">{size}</span>
                            </button>
                                {variant && (
                                  <span className={`text-xs mt-1 ${
                                    variant.stock > 10 
                                      ? 'text-green-600' 
                                      : variant.stock > 0 
                                        ? 'text-orange-600' 
                                        : 'text-red-600'
                                  }`}>
                                    {variant.stock > 0
                                      ? `${variant.stock} còn lại`
                                      : 'Hết hàng'}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-baseline gap-2 mb-4">
                      {(() => {
                        // Tìm variant được chọn
                        const selectedVariant = selectedColor && selectedSize
                          ? order.selectedProduct?.variants.find(
                              (v: any) => v.color === selectedColor && v.size === selectedSize
                            )
                          : null;

                        // Nếu đã chọn variant, hiển thị giá của variant đó
                        if (selectedVariant) {
                          const discountedPrice = getDiscountedPrice(selectedVariant);
                          return (
                            <div>
                              <span className={`text-2xl font-bold ${selectedVariant.giamGia ? 'text-green-600' : 'text-blue-600'}`}>
                                {formatCurrency(discountedPrice)}
                              </span>
                              {selectedVariant.giamGia && (
                                <div className="text-sm text-slate-400 line-through">
                                  {formatCurrency(selectedVariant.gia_ban)}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Nếu chưa chọn variant, hiển thị khoảng giá
                        const hasDiscount = order.selectedProduct?.discountInfo && order.selectedProduct?.minPrice !== order.selectedProduct?.minOriginPrice;
                        if (hasDiscount) {
                          return (
                            <div>
                              <span className="text-2xl font-bold text-green-600">
                                {formatCurrency(order.selectedProduct?.minPrice || 0)}
                                {order.selectedProduct?.minPrice !== order.selectedProduct?.maxPrice &&
                                  ` - ${formatCurrency(order.selectedProduct?.maxPrice || 0)}`}
                              </span>
                              <div className="text-sm text-slate-400 line-through">
                                {formatCurrency(order.selectedProduct?.minOriginPrice || 0)}
                                {order.selectedProduct?.minOriginPrice !== order.selectedProduct?.maxOriginPrice &&
                                  ` - ${formatCurrency(order.selectedProduct?.maxOriginPrice || 0)}`}
                              </div>
                              <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded mt-1 ml-1">Đã giảm giá</div>
                            </div>
                          );
                        } else {
                          return (
                            <span className="text-2xl font-bold text-blue-600">
                              {formatCurrency(order.selectedProduct?.minPrice || 0)}
                              {order.selectedProduct?.minPrice !== order.selectedProduct?.maxPrice &&
                                ` - ${formatCurrency(order.selectedProduct?.maxPrice || 0)}`}
                            </span>
                          );
                        }
                      })()}
                      <span className="text-sm text-slate-500">/ sản phẩm</span>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!(selectedColor && selectedSize)}
                      onClick={async () => {
                        if (selectedColor && selectedSize) {
                          const variant = order.selectedProduct?.variants.find(
                            (v: any) => v.color === selectedColor && v.size === selectedSize
                          );
                          if (variant) {
                            await handleAddToCart(variant);
                            // Lấy lại thông tin chi tiết sản phẩm bằng ID
                            await onSelectProduct(order.selectedProduct.id_san_pham);
                          }
                        }
                      }}
                    >
                      Thêm vào giỏ hàng
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog hiển thị danh sách khuyến mãi */}
      <Dialog open={isPromotionsDialogOpen} onOpenChange={setIsPromotionsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Chọn mã khuyến mãi</DialogTitle>
            <DialogDescription>
              Danh sách các mã khuyến mãi đang hoạt động
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              className="pl-10"
              placeholder="Tìm kiếm theo tên hoặc mã khuyến mãi..."
              value={promotionSearch}
              onChange={(e) => handleSearchPromotions(e.target.value)}
            />
            {promotionSearch && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => handleSearchPromotions("")}
                tabIndex={-1}
                aria-label="Xóa tìm kiếm"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {isLoadingPromotions ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên khuyến mãi</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Giá trị giảm</TableHead>
                    <TableHead>Đơn hàng tối thiểu</TableHead>
                    <TableHead>Thời gian áp dụng</TableHead>
                    <TableHead>Số lượng còn lại</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Không tìm thấy khuyến mãi nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    promotions.map((promotion) => (
                      <TableRow
                        key={promotion.khuyenMai.id_khuyen_mai}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSelectPromotion(promotion)}
                      >
                        <TableCell className="font-medium">{promotion.khuyenMai.ma_khuyen_mai}</TableCell>
                        <TableCell>{promotion.khuyenMai.ten_khuyen_mai}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{promotion.khuyenMai.mo_ta}</TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">{promotion.giaTriHienThi}</span>
                        </TableCell>
                        <TableCell>{promotion.khuyenMai.gia_tri_don_hang_toi_thieu?.toLocaleString('vi-VN')}đ</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="font-medium">Từ:</span>{" "}
                              {new Date(promotion.khuyenMai.thoi_gian_bat_dau).toLocaleString('vi-VN')}
                            </div>
                            <div>
                              <span className="font-medium">Đến:</span>{" "}
                              {new Date(promotion.khuyenMai.thoi_gian_ket_thuc).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {promotion.khuyenMai.so_luong_toi_da - promotion.khuyenMai.so_luong_da_su_dung} / {promotion.khuyenMai.so_luong_toi_da}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromotionsDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận thanh toán */}
      <Dialog open={isConfirmPaymentOpen} onOpenChange={async (value) => {
        if (value) {
          try {
            // Gọi API lấy thông tin hóa đơn khi mở dialog xác nhận

            const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
            onOrderChange({
              ...order,
              customerCash: 0 // Reset customer cash when opening dialog
            });
            setIsConfirmPaymentOpen(true);
          } catch (error) {
            console.error('Error fetching invoice details:', error);
            toast.error('Không thể tải thông tin hóa đơn');
          }
        } else {
          setIsConfirmPaymentOpen(false);
          updateOrderField('customerCash', 0);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Xác nhận thanh toán
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Vui lòng nhập số tiền khách đưa để hoàn tất thanh toán
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Thông tin thanh toán */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg space-y-3 border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  Tổng tiền cần thanh toán:
                </span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  Phương thức thanh toán:
                </span>
                <span className="font-medium text-slate-700">
                  {paymentMethods.find(m => m.id_phuong_thuc_thanh_toan === order.paymentMethodID)?.ten_phuong_thuc_thanh_toan}
                </span>
              </div>
            </div>

            {/* Nhập số tiền khách đưa */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-400" />
                Số tiền khách đưa
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={order.customerCash ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        updateOrderField('customerCash', value);
                      }
                    }}
                    placeholder="Nhập số tiền"
                    className="text-lg font-medium focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  {order.customerCash !== undefined && order.customerCash !== 0 && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => updateOrderField('customerCash', 0)}
                      tabIndex={-1}
                      aria-label="Xóa số tiền"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    updateOrderField('customerCash', totalAmount);
                  }}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                >
                  Đúng bằng
                </Button>
              </div>
            </div>

            {/* Thông tin tiền thối */}
            {order.customerCash && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg space-y-2 border border-green-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Tiền khách đưa:
                  </span>
                  <span className="font-medium text-slate-700">{formatCurrency(order.customerCash)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Tiền thối:
                  </span>
                  <span className="font-bold text-lg text-green-600">
                    {formatCurrency(Math.max(0, order.customerCash - totalAmount))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmPaymentOpen(false);
                updateOrderField('customerCash', 0);
              }}
              className="hover:bg-slate-100"
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              onClick={async () => {
                if (!order.customerCash || order.customerCash < totalAmount) {
                  toast.error('Số tiền khách đưa phải lớn hơn hoặc bằng tổng tiền cần thanh toán');
                  return;
                }

                try {
                  // Cập nhật phương thức thanh toán và số tiền khách đưa

                  const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
                  await hoaDonService.updateHoaDon({
                    id_hoa_don: order.currentOrderId,
                    id_phuong_thuc_thanh_toan: order.paymentMethodID,
                    id_khuyen_mai: invoice.khuyenMai?.id_khuyen_mai,
                    id_khach_hang: invoice.khachHang?.id_khach_hang,
                    so_tien_khach_tra: order.customerCash,
                    ghi_chu: order.note
                  });

                  // Hoàn tất thanh toán
                  await hoaDonService.hoanTatThanhToan(order.currentOrderId);
                  
                  // Lấy thông tin hóa đơn để in
                  const response = await hoaDonService.inHoaDon(order.currentOrderId);
                  
                  if (response.success) {
                    setInvoiceData(response.data);

                  toast.success('Thanh toán thành công!');
                  setIsConfirmPaymentOpen(false);
                  updateOrderField('isPaymentOpen', false);
                  updateOrderField('customerCash', 0);
                  setCustomerCashDebounced(0);
                  
                    // Mở dialog in hóa đơn
                    setIsPrintInvoiceOpen(true);
                  } else {
                    throw new Error('Không thể tải thông tin hóa đơn');
                  }
                } catch (error: any) {
                  console.error('Error completing payment:', error);
                  toast.error(error.response?.data || 'Không thể hoàn tất thanh toán');
                }
              }}
              disabled={!order.customerCash || order.customerCash < totalAmount}
            >
              Hoàn tất thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog in hóa đơn */}
      <Dialog 
        open={isPrintInvoiceOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsPrintInvoiceOpen(false);
            // Chỉ gọi callback sau khi dialog đóng
            onPaymentSuccess();
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Printer className="h-5 w-5 text-blue-600" />
              In hóa đơn
            </DialogTitle>
            <DialogDescription>
              Xem trước và in hóa đơn thanh toán
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {invoiceData && <InvoicePDF invoiceData={invoiceData} />}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setIsPrintInvoiceOpen(false);
                // Gọi callback sau khi đóng dialog
                onPaymentSuccess();
              }}
            >
              <CloseIcon className="h-4 w-4" />
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 