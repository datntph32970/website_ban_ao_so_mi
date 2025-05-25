"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
import { khachHangService } from '@/services/khach-hang.service';
import { KhachHangAdminDTO, ThemKhachHangMuaTaiQuayAdminDTO } from '@/types/khach-hang';
import { MultiSelect } from '@/components/ui/multi-select';
import { Slider } from '@/components/ui/slider';
import { attributeService } from '@/services/attribute.service';
import { sanPhamService } from '@/services/san-pham.service';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import OrderTabContent from './OrderTabContent';
import { hoaDonService } from '@/services/hoa-don.service';
import { toast } from 'react-hot-toast';
import { HoaDonAdminDTO, KhachHang_HoaDonAdminDTO } from '@/types/hoa-don';
import { authService } from '@/services/auth.service';
import Image from 'next/image';

// Đặt API_URL ở đầu file
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Thêm interface cho sản phẩm chi tiết
interface ProductDetail {
  id_san_pham: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  variants: {
    id: number;
    color: string;
    size: string;
    stock: number;
    price: number;
    gia_ban: number;
    giamGia: any;
  }[];
  images?: string[];
}

// 1. Định nghĩa interface CartItem
export interface CartItem {
  id: string;
  id_san_pham_chi_tiet: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  total: number;
}

// Phương thức thanh toán
const paymentMethods = [
  { id: "cash", name: "Tiền mặt", icon: <DollarSign className="h-5 w-5" /> },
  { id: "card", name: "Thẻ tín dụng/ghi nợ", icon: <CreditCard className="h-5 w-5" /> },
];

// Thêm interface cho variant được chọn
interface SelectedVariant {
  id: number;
  color: string;
  size: string;
  stock: number;
  price: number;
}

// Hàm format giá tiền giống trang sản phẩm
const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(Number(value));

// Hàm kiểm tra giảm giá có đang hiệu lực không
function isDiscountActive(discount: any) {
  if (!discount) return false;
  const now = new Date();
  const startDate = new Date(discount.thoi_gian_bat_dau);
  const endDate = new Date(discount.thoi_gian_ket_thuc);
  return startDate <= now && now <= endDate;
}

// Hàm tính giá sau giảm cho 1 variant
function getDiscountedPrice(variant: any) {
  if (!variant.giamGias || variant.giamGias.length === 0) return variant.gia_ban;
  
  const now = new Date();
  // Lấy giảm giá đang trong thời gian hiệu lực
  const activeDiscount = variant.giamGias
    .filter((g: any) => isDiscountActive(g))
    .sort((a: any, b: any) => new Date(b.thoi_gian_ket_thuc).getTime() - new Date(a.thoi_gian_ket_thuc).getTime())[0];

  if (!activeDiscount) return variant.gia_ban;

  if (activeDiscount.kieu_giam_gia === 'PhanTram') {
    return Math.max(0, variant.gia_ban * (1 - activeDiscount.gia_tri_giam / 100));
  }
  if (activeDiscount.kieu_giam_gia === 'SoTien') {
    return Math.max(0, variant.gia_ban - activeDiscount.gia_tri_giam);
  }
  return variant.gia_ban;
}

// Thêm interface cho chi tiết hóa đơn
interface ChiTietHoaDon {
  id_san_pham_chi_tiet: number;
  ten_san_pham: string;
  mau_sac?: string;
  kich_co?: string;
  gia_ban: number;
  so_luong: number;
}

// Thêm interface cho hóa đơn chờ
interface PendingOrder {
  id_hoa_don: string;
  chiTietHoaDons?: ChiTietHoaDon[];
  khachHang?: KhachHang_HoaDonAdminDTO;
}

// 2. Sử dụng CartItem[] thay cho any[] cho cart trong OrderTabState
interface OrderTabState {
  cart: CartItem[];
  selectedProduct: ProductDetail | null;
  isProductDetailLoading: boolean;
  selectedCustomer: KhachHangAdminDTO | null;
  customerSearch: string;
  customerOptions: KhachHangAdminDTO[];
  isAddCustomerOpen: boolean;
  newCustomer: ThemKhachHangMuaTaiQuayAdminDTO;
  isLoadingCustomer: boolean;
  receiptOpen: boolean;
  currentOrderId: string;
  paymentMethod: string;
  currentImageIndex: number;
  customerInfo: {
    name: string;
    phone: string;
  };
  isFilterOpen: boolean;
  selectedBrandIds: string[];
  selectedCategoryIds: string[];
  selectedStyleIds: string[];
  selectedMaterialIds: string[];
  selectedOriginIds: string[];
  priceRange: [number, number];
  searchTerm: string;
  discountCode: string;
  discountAmount: number;
  id_hoa_don: string;
  ma_hoa_don: string;
  ten_khach_hang: string;
  loai_hoa_don: string;
  tong_tien_don_hang: number;
  so_tien_khuyen_mai: number;
  tong_tien_phai_thanh_toan: number;
  trang_thai: string;
  ngay_tao: string;
  ten_nguoi_xu_ly: string;
  nhanVienXuLy: any;
  hoaDonChiTiets: any[];
  khuyenMai: any;
  isNewOrder: boolean;
}

// 3. Sửa getDefaultOrder
function getDefaultOrder(maxPrice: number): OrderTabState {
  return {
    cart: [],
    selectedProduct: null,
    isProductDetailLoading: false,
    selectedCustomer: null,
    customerSearch: '',
    customerOptions: [],
    isAddCustomerOpen: false,
    newCustomer: { ten_khach_hang: '', so_dien_thoai: '' },
    isLoadingCustomer: false,
    receiptOpen: false,
    currentOrderId: '',
    paymentMethod: 'cash',
    currentImageIndex: 0,
    customerInfo: {
      name: "",
      phone: "",
    },
    isFilterOpen: false,
    selectedBrandIds: [],
    selectedCategoryIds: [],
    selectedStyleIds: [],
    selectedMaterialIds: [],
    selectedOriginIds: [],
    priceRange: [0, maxPrice],
    searchTerm: '',
    discountCode: '',
    discountAmount: 0,
    id_hoa_don: '',
    ma_hoa_don: '',
    ten_khach_hang: '',
    loai_hoa_don: '',
    tong_tien_don_hang: 0,
    so_tien_khuyen_mai: 0,
    tong_tien_phai_thanh_toan: 0,
    trang_thai: '',
    ngay_tao: '',
    ten_nguoi_xu_ly: '',
    nhanVienXuLy: {},
    hoaDonChiTiets: [],
    khuyenMai: null,
    isNewOrder: true
  };
}

export default function POSPage() {
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [orders, setOrders] = useState<OrderTabState[]>([]);
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<KhachHangAdminDTO | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<KhachHangAdminDTO[]>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<ThemKhachHangMuaTaiQuayAdminDTO>({ ten_khach_hang: '', so_dien_thoai: '' });
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [origins, setOrigins] = useState<any[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [selectedOriginIds, setSelectedOriginIds] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 9,
    totalItems: 0
  });
  const [isCartUpdating, setIsCartUpdating] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  // Thêm useEffect để lấy danh sách hóa đơn chờ khi component mount
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const pendingOrders = await hoaDonService.getAllHoaDonTaiQuayCho() as PendingOrder[];
        if (pendingOrders && pendingOrders.length > 0) {
          // Lấy chi tiết cho tất cả hóa đơn chờ
          const chiTietArr = await Promise.all(
            pendingOrders.map(order => hoaDonService.getHoaDonTaiQuayChoById(order.id_hoa_don))
          );
          const newOrders = pendingOrders.map((order, idx) => {
            const chiTiet = chiTietArr[idx];
            return {
              ...getDefaultOrder(maxPrice),
              currentOrderId: order.id_hoa_don,
              hoaDonChiTiets: chiTiet.hoaDonChiTiets || [],
              selectedCustomer: order.khachHang ? {
                id_khach_hang: order.khachHang.id_khach_hang,
                ma_khach_hang: order.khachHang.ma_khach_hang,
                ten_khach_hang: order.khachHang.ten_khach_hang,
                so_dien_thoai: order.khachHang.sdt_khach_hang,
                trang_thai: 'HoatDong'
              } : null,
              discountCode: chiTiet.khuyenMai?.ma_khuyen_mai || '',
              discountAmount: chiTiet.so_tien_khuyen_mai || 0
            };
          });
          setOrders(newOrders);
          setShowEmptyState(false);
        } else {
          setIsConfirmDialogOpen(true);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách hóa đơn chờ:', error);
        toast.error('Không thể tải danh sách hóa đơn chờ');
        setIsConfirmDialogOpen(true);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchPendingOrders();
  }, [maxPrice]);

  // Fetch filter data
  useEffect(() => {
    attributeService.getAttributes('ThuongHieu').then(setBrands);
    attributeService.getAttributes('DanhMuc').then(setCategories);
    attributeService.getAttributes('KieuDang').then(setStyles);
    attributeService.getAttributes('ChatLieu').then(setMaterials);
    attributeService.getAttributes('XuatXu').then(setOrigins);
  }, []);

  // Fetch products from API
  const fetchProducts = async (page: number = 1) => {
      setIsLoadingProducts(true);
      try {
      const params = {
        trang_hien_tai: page,
        so_phan_tu_tren_trang: pagination.pageSize,
        sap_xep_theo: 'ngay_tao',
        sap_xep_tang: false
      };

      const res = await sanPhamService.getDanhSachSanPhamHoatDong(params);
      
      // Cập nhật giá trị mặc định của priceRange dựa trên gia_lon_nhat từ API
      if (res.gia_lon_nhat && typeof res.gia_lon_nhat === 'number') {
        setMaxPrice(res.gia_lon_nhat);
        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[activeOrderIndex] = {
            ...newOrders[activeOrderIndex],
            priceRange: [0, res.gia_lon_nhat as number]
          };
          return newOrders;
        });
      }

      // Cập nhật state phân trang
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages: Math.ceil(res.tong_so_phan_tu / pagination.pageSize),
        totalItems: res.tong_so_phan_tu
      }));

        const mappedProducts = (res.danh_sach || []).map(sp => {
          // Tính giá sau giảm giá cho từng variant
          const variantPrices = sp.sanPhamChiTiets?.map(v => {
            const activeDiscount = v.giamGias?.find(g => {
              const now = new Date();
              const startDate = new Date(g.thoi_gian_bat_dau);
              const endDate = new Date(g.thoi_gian_ket_thuc);
              return startDate <= now && now <= endDate;
            });

            if (activeDiscount) {
              if (activeDiscount.kieu_giam_gia === 'PhanTram') {
                return v.gia_ban * (1 - activeDiscount.gia_tri_giam / 100);
              }
              if (activeDiscount.kieu_giam_gia === 'SoTien') {
                return v.gia_ban - activeDiscount.gia_tri_giam;
              }
            }
            return v.gia_ban;
          }) || [0];

          const minPrice = Math.min(...variantPrices);
          const maxPrice = Math.max(...variantPrices);

          return {
            id: sp.id_san_pham,
            id_san_pham: sp.id_san_pham,
            code: sp.ma_san_pham,
            name: sp.ten_san_pham,
            description: sp.mo_ta,
            status: sp.trang_thai,
            imageUrl: sp.url_anh_mac_dinh
              ? (sp.url_anh_mac_dinh.startsWith('/') ? API_URL + sp.url_anh_mac_dinh : sp.url_anh_mac_dinh)
              : '',
            brand: sp.thuongHieu?.ten_thuong_hieu || '',
            category: sp.danhMuc?.ten_danh_muc || '',
            price: sp.sanPhamChiTiets?.[0]?.gia_ban ?? 0,
            stock: sp.sanPhamChiTiets?.reduce((sum: number, v: { so_luong: number }) => sum + (v.so_luong || 0), 0) ?? 0,
            minPrice,
            maxPrice,
            minOriginPrice: Math.min(...(sp.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
            maxOriginPrice: Math.max(...(sp.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
            discountInfo: sp.sanPhamChiTiets?.[0]?.giamGias?.find((g: any) => {
              const now = new Date();
              const startDate = new Date(g.thoi_gian_bat_dau);
              const endDate = new Date(g.thoi_gian_ket_thuc);
              return startDate <= now && now <= endDate;
            }) || null,
            variants: (sp.sanPhamChiTiets || []).map((v: any) => ({
              ...v,
              color: v.mauSac?.ten_mau_sac || '',
              size: v.kichCo?.ten_kich_co || '',
            })),
          };
        });
        setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

  // Thêm hàm xử lý thêm vào giỏ hàng
  const addToCart = async (productOrVariant: any) => {
    try {
      setIsCartUpdating(true);
      const currentOrder = orders[activeOrderIndex];

      if (!currentOrder) {
        return;
      }

      if (!productOrVariant) {
        toast.error('Vui lòng chọn sản phẩm');
        return;
      }

      // If no order ID exists, create a new invoice
      if (!currentOrder.currentOrderId) {
        const newInvoice = await hoaDonService.themHoaDonTaiQuay();
        // Get pending orders and update current order ID
        const pendingOrders = await hoaDonService.getAllHoaDonTaiQuayCho();
        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[activeOrderIndex].currentOrderId = newInvoice.id;
          return newOrders;
        });
      }

      // Add invoice detail using themaHoaDonChiTiet
      await hoaDonService.themaHoaDonChiTiet({
        id_hoa_don: orders[activeOrderIndex].currentOrderId,
        id_san_pham_chi_tiet: productOrVariant.id_san_pham_chi_tiet || productOrVariant.id,
        so_luong: 1
      });

      // Lấy lại chi tiết hóa đơn mới nhất từ server
      const invoice = await hoaDonService.getHoaDonTaiQuayChoById(orders[activeOrderIndex].currentOrderId);
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[activeOrderIndex].hoaDonChiTiets = invoice.hoaDonChiTiets || [];
        return newOrders;
      });

      // Cập nhật lại thông tin chi tiết sản phẩm đang hiển thị nếu có
      if (currentOrder.selectedProduct) {
        const productId = currentOrder.selectedProduct.id_san_pham || currentOrder.selectedProduct.id_san_pham.toString();
        const detail = await sanPhamService.getChiTietSanPhamHoatDong(productId);
        const mappedProduct = {
          id: parseInt(detail.id_san_pham),
          id_san_pham: detail.id_san_pham,
          code: detail.ma_san_pham,
          name: detail.ten_san_pham,
          description: detail.mo_ta,
          status: detail.trang_thai,
          imageUrl: detail.url_anh_mac_dinh
            ? (detail.url_anh_mac_dinh.startsWith('/') ? API_URL + detail.url_anh_mac_dinh : detail.url_anh_mac_dinh)
            : '',
          brand: detail.thuongHieu?.ten_thuong_hieu || '',
          category: detail.danhMuc?.ten_danh_muc || '',
          price: detail.sanPhamChiTiets?.[0]?.gia_ban ?? 0,
          stock: detail.sanPhamChiTiets?.reduce((sum: number, v: { so_luong: number }) => sum + (v.so_luong || 0), 0) ?? 0,
          minPrice: Math.min(...(detail.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
          maxPrice: Math.max(...(detail.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
          minOriginPrice: Math.min(...(detail.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          maxOriginPrice: Math.max(...(detail.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          discountInfo: detail.sanPhamChiTiets?.[0]?.giamGias?.[0] || null,
          variants: (detail.sanPhamChiTiets || []).map((v: any) => ({
            id: v.id_san_pham_chi_tiet,
            id_san_pham_chi_tiet: v.id_san_pham_chi_tiet,
            ma_san_pham_chi_tiet: v.ma_san_pham_chi_tiet,
            color: v.mauSac?.ten_mau_sac || '',
            size: v.kichCo?.ten_kich_co || '',
            stock: v.so_luong,
            price: v.gia_ban,
            gia_ban: v.gia_ban,
            giamGia: v.giamGias?.[0] || null,
            hinhAnhSanPhamChiTiets: v.hinhAnhSanPhamChiTiets || []
          })),
          images: [
            detail.url_anh_mac_dinh
              ? (detail.url_anh_mac_dinh.startsWith('/') ? API_URL + detail.url_anh_mac_dinh : detail.url_anh_mac_dinh)
              : '',
            ...(detail.sanPhamChiTiets || []).flatMap(v => 
              (v.hinhAnhSanPhamChiTiets || []).map(img => 
                img.hinh_anh_urls
                  ? (img.hinh_anh_urls.startsWith('/') ? API_URL + img.hinh_anh_urls : img.hinh_anh_urls)
                  : ''
              )
            ).filter(url => url !== '')
          ]
        };
        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[activeOrderIndex].selectedProduct = mappedProduct;
          return newOrders;
        });
      }
      toast.success('Thêm sản phẩm vào giỏ hàng thành công');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data || 'Không thể thêm sản phẩm vào giỏ hàng');
    } finally {
      setIsCartUpdating(false);
    }
  };

  // Thay đổi số lượng sản phẩm trong giỏ hàng
  const updateCartItemQuantity = async (id: string, id_san_pham_chi_tiet: string, newQuantity: number) => {
    if (!orders[activeOrderIndex]) return;
    setIsCartUpdating(true);
    // Lưu lại số lượng cũ để có thể khôi phục nếu có lỗi
    const oldQuantity = orders[activeOrderIndex].hoaDonChiTiets?.find(item => item.id_hoa_don_chi_tiet === id)?.so_luong || 0;

    try {
      if (newQuantity <= 0) {
        // Xóa sản phẩm khỏi giỏ hàng
        await hoaDonService.xoaHoaDonChiTiet(id);
      } else {
        // Sử dụng suaHoaDonChiTiet để cập nhật số lượng
        await hoaDonService.suaHoaDonChiTiet({
          id_hoa_don: orders[activeOrderIndex].currentOrderId,
          id_san_pham_chi_tiet: id_san_pham_chi_tiet,
          so_luong: newQuantity
        });
      }
      // Lấy lại chi tiết hóa đơn mới nhất từ server
      const invoice = await hoaDonService.getHoaDonTaiQuayChoById(orders[activeOrderIndex].currentOrderId);
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[activeOrderIndex].hoaDonChiTiets = invoice.hoaDonChiTiets || [];
        return newOrders;
      });
      // Cập nhật lại thông tin chi tiết sản phẩm đang hiển thị nếu có
      if (orders[activeOrderIndex].selectedProduct) {
        const productId = orders[activeOrderIndex].selectedProduct.id_san_pham || orders[activeOrderIndex].selectedProduct.id_san_pham.toString();
        const detail = await sanPhamService.getChiTietSanPhamHoatDong(productId);
        const mappedProduct = {
          id: parseInt(detail.id_san_pham),
          id_san_pham: detail.id_san_pham,
          code: detail.ma_san_pham,
          name: detail.ten_san_pham,
          description: detail.mo_ta,
          status: detail.trang_thai,
          imageUrl: detail.url_anh_mac_dinh
            ? (detail.url_anh_mac_dinh.startsWith('/') ? API_URL + detail.url_anh_mac_dinh : detail.url_anh_mac_dinh)
            : '',
          brand: detail.thuongHieu?.ten_thuong_hieu || '',
          category: detail.danhMuc?.ten_danh_muc || '',
          price: detail.sanPhamChiTiets?.[0]?.gia_ban ?? 0,
          stock: detail.sanPhamChiTiets?.reduce((sum: number, v: { so_luong: number }) => sum + (v.so_luong || 0), 0) ?? 0,
          minPrice: Math.min(...(detail.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
          maxPrice: Math.max(...(detail.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
          minOriginPrice: Math.min(...(detail.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          maxOriginPrice: Math.max(...(detail.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          discountInfo: detail.sanPhamChiTiets?.[0]?.giamGias?.[0] || null,
          variants: (detail.sanPhamChiTiets || []).map((v: any) => ({
            id: v.id_san_pham_chi_tiet,
            id_san_pham_chi_tiet: v.id_san_pham_chi_tiet,
            ma_san_pham_chi_tiet: v.ma_san_pham_chi_tiet,
            color: v.mauSac?.ten_mau_sac || '',
            size: v.kichCo?.ten_kich_co || '',
            stock: v.so_luong,
            price: v.gia_ban,
            gia_ban: v.gia_ban,
            giamGia: v.giamGias?.[0] || null,
            hinhAnhSanPhamChiTiets: v.hinhAnhSanPhamChiTiets || []
          })),
          images: [
            detail.url_anh_mac_dinh
              ? (detail.url_anh_mac_dinh.startsWith('/') ? API_URL + detail.url_anh_mac_dinh : detail.url_anh_mac_dinh)
              : '',
            ...(detail.sanPhamChiTiets || []).flatMap(v => 
              (v.hinhAnhSanPhamChiTiets || []).map(img => 
                img.hinh_anh_urls
                  ? (img.hinh_anh_urls.startsWith('/') ? API_URL + img.hinh_anh_urls : img.hinh_anh_urls)
                  : ''
              )
            ).filter(url => url !== '')
          ]
        };
        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[activeOrderIndex].selectedProduct = mappedProduct;
          return newOrders;
        });
      }
    } catch (error: any) {
      console.error('Error updating cart item quantity:', error);
      // Khôi phục lại số lượng cũ nếu có lỗi
      setOrders(prev => {
        const newOrders = [...prev];
        const activeOrder = newOrders[activeOrderIndex];
        if (activeOrder.hoaDonChiTiets) {
          activeOrder.hoaDonChiTiets = activeOrder.hoaDonChiTiets.map(item =>
            item.id_hoa_don_chi_tiet === id ? { ...item, so_luong: oldQuantity } : item
          );
        }
        return newOrders;
      });
      toast.error(error.response?.data || 'Không thể cập nhật số lượng sản phẩm');
      throw error;
    } finally {
      setIsCartUpdating(false);
    }
  };

  // Tìm kiếm khách hàng (debounce)
  useEffect(() => {
    if (!customerSearch) {
      setCustomerOptions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsLoadingCustomer(true);
      try {
        const data = await khachHangService.timKiemKhachHang(customerSearch);
        setCustomerOptions(data);
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomerOptions([]);
      } finally {
        setIsLoadingCustomer(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [customerSearch]);

  // Thêm khách hàng mới
  const handleAddCustomer = async (customerData: ThemKhachHangMuaTaiQuayAdminDTO) => {
    console.log('Customer data received:', customerData);
    
    if (!customerData.ten_khach_hang) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }

    const phoneRegex = /^(0)([0-9]{9})$/;
    if (!phoneRegex.test(customerData.so_dien_thoai)) {
      toast.error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại bắt đầu bằng 0 có 9 chữ số');
      return;
    }

    setIsLoadingCustomer(true);
    try {
      // Gọi API thêm khách hàng mới
      const id = await khachHangService.themKhachHangMuaTaiQuay(customerData);
      
      // Lấy thông tin chi tiết khách hàng vừa thêm
      const kh = await khachHangService.getChiTietKhachHang(id);
      const order = orders[activeOrderIndex];
    if (!order.currentOrderId) return;
  
      const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);

      await hoaDonService.updateHoaDon({
        id_hoa_don: order.currentOrderId,
        id_khach_hang: kh.id_khach_hang,
        id_khuyen_mai: invoice.khuyenMai?.id_khuyen_mai,
        id_phuong_thuc_thanh_toan: invoice.id_phuong_thuc_thanh_toan,
        ghi_chu: invoice.ghi_chu,
        so_tien_khach_tra: 0
      });
      // Cập nhật state
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[activeOrderIndex] = {
          ...newOrders[activeOrderIndex],
          selectedCustomer: kh,
          isAddCustomerOpen: false,
          customerSearch: '',
          customerOptions: [],
          newCustomer: { ten_khach_hang: '', so_dien_thoai: '' }
        };
        return newOrders;
      });

      toast.success('Thêm khách hàng mới thành công');
    } catch (error: any) {
      console.error('Lỗi khi thêm khách hàng:', error);
      toast.error(error.response?.data || 'Không thể thêm khách hàng mới');
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Log realtime selectedQuantities khi panel phải mở
      if (orders[activeOrderIndex]?.isFilterOpen) {
        console.log('selectedQuantities panel:', orders[activeOrderIndex]?.selectedProduct);
      }
    }
  }, [orders[activeOrderIndex]?.isFilterOpen]);

  useEffect(() => {
    if (orders[activeOrderIndex]?.selectedProduct) {
      setCurrentImageIndex(0);
    }
  }, [orders[activeOrderIndex]?.selectedProduct]);

  // Trong phần xử lý priceRange
  const handlePriceRangeChange = (value: number[]) => {
    if (!orders[activeOrderIndex]) return;
    
    setOrders(prev => {
      const newOrders = [...prev];
      const activeOrder = newOrders[activeOrderIndex];
      activeOrder.priceRange = [value[0], value[1]] as [number, number];
      return newOrders;
    });
  };

  // Handler chọn sản phẩm để mở dialog chi tiết
  const handleSelectProduct = async (product: any) => {
    console.log('Selecting product:', product);
    if (!product) {
      console.error('Invalid product object:', product);
      return;
    }

    setOrders(prev => {
      const newOrders = [...prev];
      newOrders[activeOrderIndex].isProductDetailLoading = true;
      return newOrders;
    });

    try {
      // If product is a string, it's an ID
      const productId = typeof product === 'string' ? product : product.id_san_pham;
      if (!productId) {
        throw new Error('Invalid product ID');
      }

      const detail = await sanPhamService.getChiTietSanPhamHoatDong(productId);
      console.log('Product detail from API:', detail);
      
      const mappedProduct = {
        id: parseInt(detail.id_san_pham),
        id_san_pham: detail.id_san_pham,
        code: detail.ma_san_pham,
        name: detail.ten_san_pham,
        description: detail.mo_ta,
        status: detail.trang_thai,
        imageUrl: detail.url_anh_mac_dinh
          ? (detail.url_anh_mac_dinh.startsWith('/') ? API_URL + detail.url_anh_mac_dinh : detail.url_anh_mac_dinh)
          : '',
        brand: detail.thuongHieu?.ten_thuong_hieu || '',
        category: detail.danhMuc?.ten_danh_muc || '',
        price: detail.sanPhamChiTiets?.[0]?.gia_ban ?? 0,
        stock: detail.sanPhamChiTiets?.reduce((sum: number, v: { so_luong: number }) => sum + (v.so_luong || 0), 0) ?? 0,
        minPrice: Math.min(...(detail.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
        maxPrice: Math.max(...(detail.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
        minOriginPrice: Math.min(...(detail.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
        maxOriginPrice: Math.max(...(detail.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
        discountInfo: detail.sanPhamChiTiets?.[0]?.giamGias?.[0] || null,
        variants: (detail.sanPhamChiTiets || []).map((v: any) => ({
          id: v.id_san_pham_chi_tiet,
          id_san_pham_chi_tiet: v.id_san_pham_chi_tiet,
          ma_san_pham_chi_tiet: v.ma_san_pham_chi_tiet,
          color: v.mauSac?.ten_mau_sac || '',
          size: v.kichCo?.ten_kich_co || '',
          stock: v.so_luong,
          price: v.gia_ban,
          gia_ban: v.gia_ban,
          giamGia: v.giamGias?.[0] || null,
          hinhAnhSanPhamChiTiets: v.hinhAnhSanPhamChiTiets || []
        })),
        images: [
          detail.url_anh_mac_dinh
            ? (detail.url_anh_mac_dinh.startsWith('/') ? API_URL + detail.url_anh_mac_dinh : detail.url_anh_mac_dinh)
            : '',
          ...(detail.sanPhamChiTiets || []).flatMap(v => 
            (v.hinhAnhSanPhamChiTiets || []).map(img => 
              img.hinh_anh_urls
                ? (img.hinh_anh_urls.startsWith('/') ? API_URL + img.hinh_anh_urls : img.hinh_anh_urls)
                : ''
            )
          ).filter(url => url !== '')
        ]
      };
      
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[activeOrderIndex].selectedProduct = mappedProduct;
        newOrders[activeOrderIndex].isProductDetailLoading = false;
        return newOrders;
      });
    } catch (error) {
      console.error('Error selecting product:', error);
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[activeOrderIndex].isProductDetailLoading = false;
        return newOrders;
      });
    }
  };

  // Handler thanh toán
  const handlePayment = () => {
    if (!orders[activeOrderIndex] || orders[activeOrderIndex].hoaDonChiTiets.length === 0) {
      return;
    }
    setIsPaymentOpen(true);
  };

  // Thêm hàm xử lý tạo hóa đơn mới
  const handleAddNewOrder = async () => {
    try {
      setIsAddingOrder(true);
      // Tạo hóa đơn mới
      const response = await hoaDonService.themHoaDonTaiQuay();
      const newOrderId = response;

      // Tạo tab mới với hóa đơn mới
      const newOrder = getDefaultOrder(maxPrice);
      newOrder.currentOrderId = newOrderId;
      newOrder.isNewOrder = true;

      // Cập nhật state với tab mới
      setOrders(prev => [...prev, newOrder]);
      setActiveOrderIndex(orders.length);

      // Cập nhật lại danh sách hóa đơn chờ tại quầy
      await fetchPendingOrders();

      toast.success('Đã tạo hóa đơn mới');
    } catch (error) {
      console.error('Error creating new order:', error);
      toast.error('Không thể tạo hóa đơn mới');
    } finally {
      setIsAddingOrder(false);
    }
  };

  // Thêm hàm xử lý xóa hóa đơn
  const handleDeleteOrder = async (orderIndex: number) => {
    try {
      const order = orders[orderIndex];
      
      if (!order.currentOrderId) {
        // Nếu chưa có ID hóa đơn (chưa lưu), chỉ xóa tab
        setOrders(prev => {
          const newOrders = prev.filter((_, i) => i !== orderIndex);
          if (activeOrderIndex >= newOrders.length) setActiveOrderIndex(newOrders.length - 1);
          return newOrders.length > 0 ? newOrders : [];
        });
        toast.success('Đã xóa tab hóa đơn');
        return;
      }

      // Luôn gọi API xóa nếu có currentOrderId
      await hoaDonService.xoaHoaDonTaiQuay(order.currentOrderId);
      setOrders(prev => {
        const newOrders = prev.filter((_, i) => i !== orderIndex);
        if (activeOrderIndex >= newOrders.length) setActiveOrderIndex(newOrders.length - 1);
        return newOrders.length > 0 ? newOrders : [];
      });
      toast.success('Xóa hóa đơn thành công');
    } catch (error: any) {
      console.error('Lỗi khi xóa hóa đơn:', error);
      const errorMessage = error.response?.data || error.message || 'Không thể xóa hóa đơn';
      toast.error(errorMessage);
    } finally {
      setDeleteConfirmDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  // Hàm mở dialog xác nhận xóa
  const openDeleteConfirmDialog = (orderIndex: number) => {
    setOrderToDelete(orderIndex);
    setDeleteConfirmDialogOpen(true);
  };

  // Thêm hàm xử lý xóa chi tiết hóa đơn
  const handleDeleteOrderItem = async (orderIndex: number, itemId: string) => {
    try {
      const order = orders[orderIndex];
      if (!order.currentOrderId) {
        // Nếu chưa có ID hóa đơn (chưa lưu), chỉ xóa khỏi giỏ hàng
        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[orderIndex].hoaDonChiTiets = order.hoaDonChiTiets.filter(item => item.id_hoa_don_chi_tiet !== itemId);
          return newOrders;
        });
        return;
      }

      await hoaDonService.xoaHoaDonChiTiet(itemId);
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[orderIndex].hoaDonChiTiets = order.hoaDonChiTiets.filter(item => item.id_hoa_don_chi_tiet !== itemId);
        return newOrders;
      });

      // Cập nhật lại thông tin chi tiết sản phẩm đang hiển thị nếu có
      if (orders[orderIndex].selectedProduct) {
        const productId = orders[orderIndex].selectedProduct.id_san_pham || orders[orderIndex].selectedProduct.id_san_pham.toString();
        const detail = await sanPhamService.getChiTietSanPhamHoatDong(productId);
        const mappedProduct = {
          id: parseInt(detail.id_san_pham),
          id_san_pham: detail.id_san_pham,
          code: detail.ma_san_pham,
          name: detail.ten_san_pham,
          description: detail.mo_ta,
          status: detail.trang_thai,
          imageUrl: detail.url_anh_mac_dinh
            ? (detail.url_anh_mac_dinh.startsWith('/') ? API_URL + detail.url_anh_mac_dinh : detail.url_anh_mac_dinh)
            : '',
          brand: detail.thuongHieu?.ten_thuong_hieu || '',
          category: detail.danhMuc?.ten_danh_muc || '',
          price: detail.sanPhamChiTiets?.[0]?.gia_ban ?? 0,
          stock: detail.sanPhamChiTiets?.reduce((sum: number, v: { so_luong: number }) => sum + (v.so_luong || 0), 0) ?? 0,
          minPrice: Math.min(...(detail.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
          maxPrice: Math.max(...(detail.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
          minOriginPrice: Math.min(...(detail.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          maxOriginPrice: Math.max(...(detail.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          discountInfo: detail.sanPhamChiTiets?.[0]?.giamGias?.[0] || null,
          variants: (detail.sanPhamChiTiets || []).map((v: any) => ({
            id: v.id_san_pham_chi_tiet,
            id_san_pham_chi_tiet: v.id_san_pham_chi_tiet,
            ma_san_pham_chi_tiet: v.ma_san_pham_chi_tiet,
            color: v.mauSac?.ten_mau_sac || '',
            size: v.kichCo?.ten_kich_co || '',
            stock: v.so_luong,
            price: v.gia_ban,
            gia_ban: v.gia_ban,
            giamGia: v.giamGias?.[0] || null,
            hinhAnhSanPhamChiTiets: v.hinhAnhSanPhamChiTiets || []
          })),
          images: [
            detail.url_anh_mac_dinh
              ? (detail.url_anh_mac_dinh.startsWith('/') ? API_URL + detail.url_anh_mac_dinh : detail.url_anh_mac_dinh)
              : '',
            ...(detail.sanPhamChiTiets || []).flatMap(v => 
              (v.hinhAnhSanPhamChiTiets || []).map(img => 
                img.hinh_anh_urls
                  ? (img.hinh_anh_urls.startsWith('/') ? API_URL + img.hinh_anh_urls : img.hinh_anh_urls)
                  : ''
              )
            ).filter(url => url !== '')
          ]
        };
        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[orderIndex].selectedProduct = mappedProduct;
          return newOrders;
        });
      }
    } catch (error: any) {
      console.error('Error deleting order item:', error);
      toast.error(error.response?.data || 'Không thể xóa sản phẩm khỏi hóa đơn');
    }
  };

  // Thay đổi sự kiện khi đổi tab hóa đơn
  const handleTabChange = async (idx: number) => {
    setActiveOrderIndex(idx);
    const orderId = orders[idx]?.currentOrderId;
    
    if (orderId) {
      try {
        const chiTiet = await hoaDonService.getHoaDonTaiQuayChoById(orderId);
        setOrders(prev => {
          const newOrders = [...prev];
          // Reset to default state first
          const defaultOrder = {
            ...getDefaultOrder(maxPrice),
            currentOrderId: orderId,
            isNewOrder: false,
            // Reset all promotion related fields
            khuyenMai: null,
            discountCode: '',
            discountAmount: 0,
            so_tien_khuyen_mai: 0
          };
          // Then update with server data
          newOrders[idx] = {
            ...defaultOrder,
            hoaDonChiTiets: chiTiet.hoaDonChiTiets || [],
            selectedCustomer: chiTiet.khachHang ? {
              id_khach_hang: chiTiet.khachHang.id_khach_hang,
              ma_khach_hang: chiTiet.khachHang.ma_khach_hang,
              ten_khach_hang: chiTiet.khachHang.ten_khach_hang,
              so_dien_thoai: chiTiet.khachHang.sdt_khach_hang,
              trang_thai: 'HoatDong'
            } : null,
            khuyenMai: chiTiet.khuyenMai,
            discountCode: chiTiet.khuyenMai?.ma_khuyen_mai || '',
            discountAmount: chiTiet.so_tien_khuyen_mai || 0,
            tong_tien_don_hang: chiTiet.tong_tien_don_hang || 0,
            so_tien_khuyen_mai: chiTiet.so_tien_khuyen_mai || 0,
            tong_tien_phai_thanh_toan: chiTiet.tong_tien_phai_thanh_toan || 0
          };
          return newOrders;
        });
      } catch (err) {
        console.error('Error loading order details:', err);
        toast.error('Không thể tải thông tin hóa đơn');
      }
    }
  };

  // Hàm xử lý khi ấn nút Áp dụng
  const handleApplyFilter = async () => {
    if (!orders[activeOrderIndex]) return;
    
    setIsApplyingFilter(true);
    try {
      const currentOrder = orders[activeOrderIndex];
      
      const params = {
        trang_hien_tai: 1, // Reset về trang 1
        so_phan_tu_tren_trang: pagination.pageSize,
        tim_kiem: currentOrder.searchTerm || undefined,
        id_thuong_hieu: currentOrder.selectedBrandIds.length > 0 ? currentOrder.selectedBrandIds : undefined,
        id_danh_muc: currentOrder.selectedCategoryIds.length > 0 ? currentOrder.selectedCategoryIds : undefined,
        id_kieu_dang: currentOrder.selectedStyleIds.length > 0 ? currentOrder.selectedStyleIds : undefined,
        id_chat_lieu: currentOrder.selectedMaterialIds.length > 0 ? currentOrder.selectedMaterialIds : undefined,
        id_xuat_xu: currentOrder.selectedOriginIds.length > 0 ? currentOrder.selectedOriginIds : undefined,
        gia_tu: currentOrder.priceRange[0] > 0 ? currentOrder.priceRange[0] : undefined,
        gia_den: currentOrder.priceRange[1] < maxPrice ? currentOrder.priceRange[1] : undefined,
        sap_xep_theo: 'ngay_tao',
        sap_xep_tang: false
      };

      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      );

      const res = await sanPhamService.getDanhSachSanPhamHoatDong(cleanParams);
      
      // Cập nhật state phân trang
      setPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalPages: Math.ceil(res.tong_so_phan_tu / pagination.pageSize),
        totalItems: res.tong_so_phan_tu
      }));

      const mappedProducts = (res.danh_sach || []).map(sp => {
        // Tính giá sau giảm giá cho từng variant
        const variantPrices = sp.sanPhamChiTiets?.map(v => {
          const activeDiscount = v.giamGias?.find(g => {
            const now = new Date();
            const startDate = new Date(g.thoi_gian_bat_dau);
            const endDate = new Date(g.thoi_gian_ket_thuc);
            return startDate <= now && now <= endDate;
          });

          if (activeDiscount) {
            if (activeDiscount.kieu_giam_gia === 'PhanTram') {
              return v.gia_ban * (1 - activeDiscount.gia_tri_giam / 100);
            }
            if (activeDiscount.kieu_giam_gia === 'SoTien') {
              return v.gia_ban - activeDiscount.gia_tri_giam;
            }
          }
          return v.gia_ban;
        }) || [0];

        const minPrice = Math.min(...variantPrices);
        const maxPrice = Math.max(...variantPrices);

        return {
          id: sp.id_san_pham,
          id_san_pham: sp.id_san_pham,
          code: sp.ma_san_pham,
          name: sp.ten_san_pham,
          description: sp.mo_ta,
          status: sp.trang_thai,
          imageUrl: sp.url_anh_mac_dinh
            ? (sp.url_anh_mac_dinh.startsWith('/') ? API_URL + sp.url_anh_mac_dinh : sp.url_anh_mac_dinh)
            : '',
          brand: sp.thuongHieu?.ten_thuong_hieu || '',
          category: sp.danhMuc?.ten_danh_muc || '',
          price: sp.sanPhamChiTiets?.[0]?.gia_ban ?? 0,
          stock: sp.sanPhamChiTiets?.reduce((sum: number, v: { so_luong: number }) => sum + (v.so_luong || 0), 0) ?? 0,
          minPrice,
          maxPrice,
          minOriginPrice: Math.min(...(sp.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          maxOriginPrice: Math.max(...(sp.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          discountInfo: sp.sanPhamChiTiets?.[0]?.giamGias?.find((g: any) => {
            const now = new Date();
            const startDate = new Date(g.thoi_gian_bat_dau);
            const endDate = new Date(g.thoi_gian_ket_thuc);
            return startDate <= now && now <= endDate;
          }) || null,
          variants: (sp.sanPhamChiTiets || []).map((v: any) => ({
            ...v,
            color: v.mauSac?.ten_mau_sac || '',
            size: v.kichCo?.ten_kich_co || '',
          })),
        };
      });
      setProducts(mappedProducts);
      
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[activeOrderIndex].isFilterOpen = false;
        return newOrders;
      });
      
    } catch (error) {
      console.error('Error applying filter:', error);
      toast.error('Không thể áp dụng bộ lọc');
    } finally {
      setIsApplyingFilter(false);
    }
  };

  // Đồng bộ customerSearch từ order con lên POSPage
  useEffect(() => {
    if (orders[activeOrderIndex] && orders[activeOrderIndex].customerSearch !== customerSearch) {
      setCustomerSearch(orders[activeOrderIndex].customerSearch);
    }
  }, [orders, activeOrderIndex]);

  // Hàm cập nhật khách hàng cho hóa đơn
  const handleSelectCustomer = async (customer: any) => {
    const order = orders[activeOrderIndex];
    if (!order.currentOrderId) return;
    try {
      const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);

      await hoaDonService.updateHoaDon({
        id_hoa_don: order.currentOrderId,
        id_khach_hang: customer.id_khach_hang,
        id_khuyen_mai: invoice.khuyenMai?.id_khuyen_mai,
        id_phuong_thuc_thanh_toan: invoice.id_phuong_thuc_thanh_toan,
        ghi_chu: invoice.ghi_chu,
        so_tien_khach_tra: 0
      });
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[activeOrderIndex] = {
          ...order,
          selectedCustomer: customer,
          customerSearch: ''
        };
        return newOrders;
      });
      toast.success('Đã chọn khách hàng cho hóa đơn');
    } catch (error: any) {
      toast.error(error.response?.data || 'Không thể cập nhật khách hàng cho hóa đơn');
    }
  };

  const handleUnselectCustomer = async () => {
    const order = orders[activeOrderIndex];
    if (!order.currentOrderId) return;
    try {
      const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
      await hoaDonService.updateHoaDon({
        id_hoa_don: order.currentOrderId,
        id_khach_hang: undefined,
        id_khuyen_mai: invoice.khuyenMai?.id_khuyen_mai,
        id_phuong_thuc_thanh_toan: invoice.id_phuong_thuc_thanh_toan,
        ghi_chu: invoice.ghi_chu,
        so_tien_khach_tra: 0
      });
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[activeOrderIndex] = {
          ...order,
          selectedCustomer: null
        };
        return newOrders;
      });
      toast.success('Đã bỏ chọn khách hàng');
    } catch (error: any) {
      toast.error(error.response?.data || 'Không thể bỏ chọn khách hàng');
    }
  };

  // Thêm hàm xử lý áp dụng mã khuyến mãi
  const handleApplyDiscountCode = async (orderIndex: number, code: string) => {
    try {
      const order = orders[orderIndex];
      if (!order.currentOrderId) return;
      const invoice = await hoaDonService.getHoaDonTaiQuayChoById(order.currentOrderId);
      // Gọi API kiểm tra mã khuyến mãi
      const response = await hoaDonService.updateHoaDon({
        id_hoa_don: order.currentOrderId,
        id_khuyen_mai: code,
        id_khach_hang: invoice.khachHang?.id_khach_hang,
        id_phuong_thuc_thanh_toan: invoice.id_phuong_thuc_thanh_toan,
        ghi_chu: invoice.ghi_chu,
        so_tien_khach_tra: 0
      });

      // Cập nhật state với thông tin giảm giá
      setOrders(prev => {
        const newOrders = [...prev];
        // Giữ nguyên mã khuyến mãi hiển thị trong input
        newOrders[orderIndex] = {
          ...newOrders[orderIndex],
          discountAmount: response.so_tien_giam || 0
        };
        return newOrders;
      });

    } catch (error: any) {
      console.error('Error applying discount code:', error);
      toast.error(error.response?.data || 'Không thể áp dụng mã khuyến mãi');
    }
  };

  // Thêm hàm xử lý thanh toán thành công
  const handlePaymentSuccess = async () => {
    try {
      // Lấy lại danh sách hóa đơn chờ mới nhất
      const pendingOrders = await hoaDonService.getAllHoaDonTaiQuayCho();
      
      if (pendingOrders && pendingOrders.length > 0) {
        // Lấy chi tiết hóa đơn đầu tiên
        const firstOrder = pendingOrders[0];
        const chiTiet = await hoaDonService.getHoaDonTaiQuayChoById(firstOrder.id_hoa_don);
        
        // Cập nhật state với danh sách hóa đơn mới
        const newOrders = pendingOrders.map((order, idx) => ({
          ...getDefaultOrder(maxPrice),
          currentOrderId: order.id_hoa_don,
          hoaDonChiTiets: idx === 0
            ? (chiTiet.hoaDonChiTiets || []).map((item: any) => ({
                id: item.id_hoa_don_chi_tiet.toString(),
                id_san_pham_chi_tiet: item.id_san_pham_chi_tiet,
                name: [
                  item.sanPhamChiTiet?.ten_san_pham,
                  item.sanPhamChiTiet?.ten_mau_sac,
                  item.sanPhamChiTiet?.ten_kich_co
                ].filter(Boolean).join(' - '),
                price: item.gia_sau_giam_gia,
                originalPrice: item.don_gia,
                quantity: item.so_luong,
                total: item.thanh_tien
              }))
            : [],
          selectedCustomer: order.khachHang ? {
            id_khach_hang: order.khachHang.id_khach_hang,
            ma_khach_hang: order.khachHang.ma_khach_hang,
            ten_khach_hang: order.khachHang.ten_khach_hang,
            so_dien_thoai: order.khachHang.sdt_khach_hang,
            trang_thai: 'HoatDong'
          } : null,
          discountCode: chiTiet.khuyenMai?.ma_khuyen_mai || '',
          discountAmount: chiTiet.so_tien_khuyen_mai || 0
        }));
        
        setOrders(newOrders);
        setShowEmptyState(false);
      } else {
        // Nếu không còn hóa đơn nào, hiển thị trạng thái trống
        setOrders([]);
        setShowEmptyState(true);
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
      toast.error('Không thể cập nhật danh sách hóa đơn');
    }
  };

  // Hàm lấy danh sách hóa đơn chờ tại quầy
  const fetchPendingOrders = async () => {
    try {
      const response = await hoaDonService.getAllHoaDonTaiQuayCho();
      setPendingOrders(response);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast.error('Không thể tải danh sách hóa đơn chờ');
    }
  };

  return (
    <AdminLayout>
      {isLoadingOrders ? (
        // Hiển thị trạng thái loading
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <h2 className="text-2xl font-semibold text-slate-700">Đang tải dữ liệu...</h2>
            <p className="text-slate-500">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      ) : showEmptyState || orders.length === 0 ? (
        // Hiển thị màn hình trống
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <ShoppingCart className="h-16 w-16 mx-auto text-slate-300" />
            <h2 className="text-2xl font-semibold text-slate-700">Chưa có hóa đơn nào</h2>
            <p className="text-slate-500">Bắt đầu tạo hóa đơn mới để tiếp tục</p>
            <Button 
              size="lg"
              onClick={handleAddNewOrder}
              className="mt-4"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tạo hóa đơn mới
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex gap-2 mb-4">
            {isLoadingOrders ? (
              <div className="flex items-center gap-2 text-slate-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Đang tải hóa đơn...
              </div>
            ) : (
              <>
                {orders.map((order, idx) => (
                  <button
                    key={idx}
                    className={`px-4 py-2 rounded-t-lg border-b-2 ${activeOrderIndex === idx ? 'border-blue-600 bg-white font-bold' : 'border-transparent bg-slate-100'}`}
                    onClick={() => handleTabChange(idx)}
                  >
                    Hóa đơn {idx + 1}
                    <span
                      className="ml-2 text-red-500 cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        openDeleteConfirmDialog(idx);
                      }}
                    >×</span>
                  </button>
                ))}
                <button
                  className="px-4 py-2 rounded-t-lg border-b-2 border-transparent bg-slate-100 text-blue-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddNewOrder}
                  disabled={isAddingOrder}
                >
                  {isAddingOrder ? 'Đang tạo...' : '+ Hóa đơn mới'}
                </button>
              </>
            )}
          </div>

          {/* Nội dung từng tab hóa đơn */}
          {orders.length > 0 && orders[activeOrderIndex] && (
            <OrderTabContent
              order={orders[activeOrderIndex]}
              onOrderChange={order => {
                if (order.selectedCustomer && order.selectedCustomer !== orders[activeOrderIndex].selectedCustomer) {
                  handleSelectCustomer(order.selectedCustomer);
                  return;
                }
                if (!order.selectedCustomer && orders[activeOrderIndex].selectedCustomer) {
                  handleUnselectCustomer();
                  return;
                }
                setOrders(prev => {
                  const newOrders = [...prev];
                  newOrders[activeOrderIndex] = order;
                  return newOrders;
                });
              }}
              products={products}
              customerOptions={customerOptions}
              brands={brands}
              categories={categories}
              styles={styles}
              materials={materials}
              origins={origins}
              onSelectProduct={handleSelectProduct}
              onAddToCart={addToCart}
              onUpdateCartItemQuantity={updateCartItemQuantity}
              onDeleteOrderItem={handleDeleteOrderItem}
              onAddCustomer={handleAddCustomer}
              onPayment={handlePayment}
              onApplyFilter={handleApplyFilter}
              onApplyDiscountCode={(code) => handleApplyDiscountCode(activeOrderIndex, code)}
              maxPrice={maxPrice}
              pagination={pagination}
              onPageChange={fetchProducts}
              onPaymentSuccess={handlePaymentSuccess}
              isCartUpdating={isCartUpdating}
            />
          )}
        </>
      )}

      {/* Dialog xác nhận tạo hóa đơn mới */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tạo hóa đơn mới</DialogTitle>
            <DialogDescription>
              Không có hóa đơn nào đang chờ. Bạn có muốn tạo một hóa đơn mới không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsConfirmDialogOpen(false);
              setShowEmptyState(true);
              setOrders([]); // Cho phép không có hóa đơn nào
            }}>
              Hủy
            </Button>
            <Button onClick={() => {
              handleAddNewOrder();
              setIsConfirmDialogOpen(false);
            }}
            autoFocus
            >
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa hóa đơn */}
      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa hóa đơn</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa hóa đơn này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteConfirmDialogOpen(false);
              setOrderToDelete(null);
            }}>
              Hủy
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (orderToDelete !== null) {
                  handleDeleteOrder(orderToDelete);
                }
              }}
              autoFocus
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
