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

// Thêm interface cho sản phẩm chi tiết
interface ProductDetail {
  id: number;
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


const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Phương thức thanh toán
const paymentMethods = [
  { id: "cash", name: "Tiền mặt", icon: <DollarSign className="h-5 w-5" /> },
  { id: "card", name: "Thẻ tín dụng/ghi nợ", icon: <CreditCard className="h-5 w-5" /> },
];

// Interface cho giỏ hàng
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

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

// Hàm tính giá sau giảm cho 1 variant
function getDiscountedPrice(variant: any) {
  if (!variant.giamGia) return variant.gia_ban;
  if (variant.giamGia.kieu_giam_gia === 'PhanTram') {
    return Math.max(0, variant.gia_ban * (1 - variant.giamGia.gia_tri_giam / 100));
  }
  if (variant.giamGia.kieu_giam_gia === 'SoTien') {
    return Math.max(0, variant.gia_ban - variant.giamGia.gia_tri_giam);
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

// 1. Type cho 1 tab hóa đơn
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
}

function getDefaultOrder(): OrderTabState {
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
    priceRange: [0, 5000000]
  };
}

export default function POSPage() {
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

  // Thêm useEffect để lấy danh sách hóa đơn chờ khi component mount
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const pendingOrders = await hoaDonService.getAllHoaDonTaiQuayCho() as PendingOrder[];
        if (pendingOrders && pendingOrders.length > 0) {
          // Lấy chi tiết hóa đơn đầu tiên (hoặc active)
          const firstOrder = pendingOrders[0];
          const chiTiet = await hoaDonService.getHoaDonTaiQuayChoById(firstOrder.id_hoa_don);
          const newOrders = pendingOrders.map((order, idx) => ({
            ...getDefaultOrder(),
            currentOrderId: order.id_hoa_don,
            cart: idx === 0
              ? (chiTiet.hoaDonChiTiets || []).map((item: any) => ({
                  id: item.id_hoa_don_chi_tiet.toString(),
                  id_san_pham_chi_tiet: item.id_san_pham_chi_tiet,
                  name: [
                    item.sanPhamChiTiet?.ten_san_pham,
                    item.sanPhamChiTiet?.ten_mau_sac,
                    item.sanPhamChiTiet?.ten_kich_co
                  ].filter(Boolean).join(' - '),
                  price: item.gia_sau_giam_gia ?? item.don_gia,
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
            } : null
          }));
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
  }, []);

  // Fetch filter data
  useEffect(() => {
    attributeService.getAttributes('ThuongHieu').then(setBrands);
    attributeService.getAttributes('DanhMuc').then(setCategories);
    attributeService.getAttributes('KieuDang').then(setStyles);
    attributeService.getAttributes('ChatLieu').then(setMaterials);
    attributeService.getAttributes('XuatXu').then(setOrigins);
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const res = await sanPhamService.getDanhSachSanPham({
          trang_hien_tai: 1,
          so_phan_tu_tren_trang: 9,
          tim_kiem: searchTerm,
          id_thuong_hieu: selectedBrandIds.length > 0 ? selectedBrandIds : undefined,
          id_danh_muc: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
          id_kieu_dang: selectedStyleIds.length > 0 ? selectedStyleIds : undefined,
          id_chat_lieu: selectedMaterialIds.length > 0 ? selectedMaterialIds : undefined,
          id_xuat_xu: selectedOriginIds.length > 0 ? selectedOriginIds : undefined,
          gia_tu: priceRange[0] > 0 ? priceRange[0] : undefined,
          gia_den: priceRange[1] < 5000000 ? priceRange[1] : undefined,
        });
        const mappedProducts = (res.danh_sach || []).map(sp => ({
          id: sp.id_san_pham,
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
          minPrice: Math.min(...(sp.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
          maxPrice: Math.max(...(sp.sanPhamChiTiets?.map(v => getDiscountedPrice(v)) || [0])),
          minOriginPrice: Math.min(...(sp.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          maxOriginPrice: Math.max(...(sp.sanPhamChiTiets?.map(v => v.gia_ban) || [0])),
          discountInfo: sp.sanPhamChiTiets?.[0]?.giamGia || null,
          variants: (sp.sanPhamChiTiets || []).map((v: {
            id_san_pham_chi_tiet: string;
            ma_san_pham_chi_tiet: string;
            mauSac?: { ten_mau_sac: string; id_mau_sac: number };
            kichCo?: { ten_kich_co: string; id_kich_co: number };
            so_luong: number;
            gia_ban: number;
            hinhAnhSanPhamChiTiets?: Array<{ hinh_anh_urls: string }>;
            giamGia?: any;
          }) => ({
            ...v,
            color: v.mauSac?.ten_mau_sac || '',
            size: v.kichCo?.ten_kich_co || '',
          })),
        }));
        setProducts(mappedProducts);
      } catch {
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [searchTerm, selectedBrandIds, selectedCategoryIds, selectedStyleIds, selectedMaterialIds, selectedOriginIds, priceRange]);

  // Lọc sản phẩm theo filter (nếu cần filter thêm phía client)
  const filteredProducts = products;

  // Tính tổng tiền giỏ hàng
  const cartTotal = orders[activeOrderIndex]?.cart?.reduce((total, item) => total + item.total, 0) || 0;

  // Hàm lấy danh sách màu sắc duy nhất từ variants
  const getUniqueColors = (variants: ProductDetail['variants']) => {
    return [...new Set(variants.map(v => v.color))];
  };

  // Hàm lấy danh sách kích thước theo màu đã chọn
  const getSizesByColor = (variants: ProductDetail['variants'], color: string) => {
    return variants.filter(v => v.color === color);
  };

  // Thêm hàm xử lý thêm vào giỏ hàng
  const addToCart = async (productOrVariant: any) => {
    try {
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
        console.log('Pending orders:', pendingOrders);

        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[activeOrderIndex].currentOrderId = newInvoice.id;
          return newOrders;
        });
      }

      // Add invoice detail
      console.log('Adding invoice detail for product/variant:', productOrVariant);
      await hoaDonService.themHoacSuaHoaDonChiTiet({
        id_hoa_don: orders[activeOrderIndex].currentOrderId,
        id_san_pham_chi_tiet: productOrVariant.id,
        so_luong: 1
      });

      // Lấy lại hóa đơn chờ và đồng bộ cart
      const pendingOrders = await hoaDonService.getAllHoaDonTaiQuayCho();
      const updatedOrder = pendingOrders.find(
        (o: any) => o.id_hoa_don === orders[activeOrderIndex].currentOrderId
      );
      if (updatedOrder) {
        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[activeOrderIndex].cart = (updatedOrder.hoaDonChiTiets || []).map((item: any) => ({
            id: item.id_hoa_don_chi_tiet.toString(),
            id_san_pham_chi_tiet: item.id_san_pham_chi_tiet,
            name: [
              item.sanPhamChiTiet?.ten_san_pham,
              item.sanPhamChiTiet?.ten_mau_sac,
              item.sanPhamChiTiet?.ten_kich_co
            ].filter(Boolean).join(' - '),
            price: item.gia_sau_giam_gia ?? item.don_gia,
            originalPrice: item.don_gia,
            quantity: item.so_luong,
            total: item.thanh_tien
          }));
          return newOrders;
        });
      }

      toast.success('Thêm sản phẩm vào giỏ hàng thành công');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data || 'Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  // Thay đổi số lượng sản phẩm trong giỏ hàng
  const updateCartItemQuantity = async (id: string, id_san_pham_chi_tiet: string, newQuantity: number) => {
    if (!orders[activeOrderIndex]) return;

    // Lưu lại số lượng cũ để có thể khôi phục nếu có lỗi
    const oldQuantity = orders[activeOrderIndex].cart.find(item => item.id === id)?.quantity || 0;

    try {
      if (newQuantity <= 0) {
        // Xóa sản phẩm khỏi giỏ hàng
        await hoaDonService.xoaHoaDonChiTiet(id);
        setOrders(prev => {
          const newOrders = [...prev];
          const activeOrder = newOrders[activeOrderIndex];
          newOrders[activeOrderIndex].cart = activeOrder.cart.filter(item => item.id !== id);
          return newOrders;
        });
      } else {
        // Cập nhật số lượng
        console.log('Updating cart item with data:', {
          id_hoa_don: orders[activeOrderIndex].currentOrderId,
          id_san_pham_chi_tiet: id_san_pham_chi_tiet,
          so_luong: newQuantity
        });
        
        // Cập nhật trực tiếp số lượng trong cart trước khi gọi API
        setOrders(prev => {
          const newOrders = [...prev];
          const activeOrder = newOrders[activeOrderIndex];
          newOrders[activeOrderIndex].cart = activeOrder.cart.map(item => 
            item.id === id ? { ...item, quantity: newQuantity, total: item.price * newQuantity } : item
          );
          return newOrders;
        });

        await hoaDonService.themHoacSuaHoaDonChiTiet({
          id_hoa_don: orders[activeOrderIndex].currentOrderId,
          id_san_pham_chi_tiet: id_san_pham_chi_tiet,
          so_luong: newQuantity
        });

        // Lấy lại hóa đơn chờ và đồng bộ cart
        const pendingOrders = await hoaDonService.getAllHoaDonTaiQuayCho();
        const updatedOrder = pendingOrders.find(
          (o: any) => o.id_hoa_don === orders[activeOrderIndex].currentOrderId
        );
        if (updatedOrder) {
          setOrders(prev => {
            const newOrders = [...prev];
            newOrders[activeOrderIndex].cart = (updatedOrder.hoaDonChiTiets || []).map((item: any) => ({
              id: item.id_hoa_don_chi_tiet.toString(),
              id_san_pham_chi_tiet: item.id_san_pham_chi_tiet,
              name: [
                item.sanPhamChiTiet?.ten_san_pham,
                item.sanPhamChiTiet?.ten_mau_sac,
                item.sanPhamChiTiet?.ten_kich_co
              ].filter(Boolean).join(' - '),
              price: item.gia_sau_giam_gia ?? item.don_gia,
              originalPrice: item.don_gia,
              quantity: item.so_luong,
              total: item.thanh_tien
            }));
            return newOrders;
          });
        }
      }
    } catch (error: any) {
      console.error('Error updating cart item quantity:', error);
      // Khôi phục lại số lượng cũ nếu có lỗi
      setOrders(prev => {
        const newOrders = [...prev];
        const activeOrder = newOrders[activeOrderIndex];
        newOrders[activeOrderIndex].cart = activeOrder.cart.map(item => 
          item.id === id ? { ...item, quantity: oldQuantity, total: item.price * oldQuantity } : item
        );
        return newOrders;
      });
      toast.error(error.response?.data || 'Không thể cập nhật số lượng sản phẩm');
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
        const all = await khachHangService.getDanhSachKhachHang();
        const filtered = all.filter(kh =>
          (kh.ten_khach_hang?.toLowerCase() || '').includes(customerSearch.toLowerCase()) ||
          (kh.so_dien_thoai || '').includes(customerSearch)
        );
        setCustomerOptions(filtered);
      } catch {
        setCustomerOptions([]);
      } finally {
        setIsLoadingCustomer(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [customerSearch]);

  // Thêm khách hàng mới
  const handleAddCustomer = async () => {
    if (!newCustomer.ten_khach_hang.trim() || !newCustomer.so_dien_thoai.trim()) return;
    setIsLoadingCustomer(true);
    try {
      const id = await khachHangService.themKhachHangMuaTaiQuay(newCustomer);
      const kh = await khachHangService.getChiTietKhachHang(id);
      setSelectedCustomer(kh);
      setIsAddCustomerOpen(false);
      setCustomerSearch('');
      setCustomerOptions([]);
      setNewCustomer({ ten_khach_hang: '', so_dien_thoai: '' });
    } catch {
      // handle error
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
    setOrders(prev => {
      const newOrders = [...prev];
      newOrders[activeOrderIndex].isProductDetailLoading = true;
      return newOrders;
    });
    try {
      const detail = await sanPhamService.getChiTietSanPham(product.id);
      console.log('Product detail from API:', detail);
      
      const mappedProduct = {
        id: parseInt(detail.id_san_pham),
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
        discountInfo: detail.sanPhamChiTiets?.[0]?.giamGia || null,
        variants: (detail.sanPhamChiTiets || []).map((v: any) => ({
          id: v.id_san_pham_chi_tiet,
          id_san_pham_chi_tiet: v.id_san_pham_chi_tiet,
          ma_san_pham_chi_tiet: v.ma_san_pham_chi_tiet,
          color: v.mauSac?.ten_mau_sac || '',
          size: v.kichCo?.ten_kich_co || '',
          stock: v.so_luong,
          price: v.gia_ban,
          gia_ban: v.gia_ban,
          giamGia: v.giamGia || null,
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
    if (!orders[activeOrderIndex] || orders[activeOrderIndex].cart.length === 0) {
      return;
    }
    setIsPaymentOpen(true);
  };

  // Thêm hàm xử lý tạo hóa đơn mới
  const handleAddNewOrder = async () => {
    try {
      setIsAddingOrder(true);
      const response = await hoaDonService.themHoaDonTaiQuay();
      
      // Kiểm tra response có phải là ID của hóa đơn mới không
      if (response && typeof response === 'string' && response !== 'Thêm hóa đơn thành công') {
        // Tạo tab mới với ID hóa đơn mới
        const newOrder = {
          ...getDefaultOrder(),
          currentOrderId: response, // Sử dụng ID từ response
          cart: [],
          selectedCustomer: null
        };
        
        // Thêm tab mới và chuyển sang tab đó
        setOrders(prev => [...prev, newOrder]);
        setActiveOrderIndex(orders.length);
        setShowEmptyState(false);
        toast.success('Tạo hóa đơn mới thành công');
      } else {
        throw new Error('Không nhận được ID hóa đơn mới từ server');
      }
    } catch (error: any) {
      console.error('Lỗi khi tạo hóa đơn mới:', error);
      const errorMessage = error.response?.data || error.message || 'Không thể tạo hóa đơn mới';
      toast.error(errorMessage);
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
          newOrders[orderIndex].cart = newOrders[orderIndex].cart.filter(item => item.id !== itemId);
          return newOrders;
        });
        return;
      }

      await hoaDonService.xoaHoaDonChiTiet(itemId);
      setOrders(prev => {
        const newOrders = [...prev];
        newOrders[orderIndex].cart = newOrders[orderIndex].cart.filter(item => item.id !== itemId);
        return newOrders;
      });
      toast.success('Xóa sản phẩm khỏi hóa đơn thành công');
    } catch (error: any) {
      toast.error(error.response?.data || 'Không thể xóa sản phẩm khỏi hóa đơn');
    }
  };

  // Thay đổi sự kiện khi đổi tab hóa đơn
  const handleTabChange = async (idx: number) => {
    setActiveOrderIndex(idx);
    const orderId = orders[idx].currentOrderId;
    if (orderId) {
      try {
        const chiTiet = await hoaDonService.getHoaDonTaiQuayChoById(orderId);
        setOrders(prev => {
          const newOrders = [...prev];
          newOrders[idx] = {
            ...newOrders[idx],
            cart: (chiTiet.hoaDonChiTiets || []).map((item: any) => ({
              id: item.id_hoa_don_chi_tiet.toString(),
              id_san_pham_chi_tiet: item.id_san_pham_chi_tiet,
              name: [
                item.sanPhamChiTiet?.ten_san_pham,
                item.sanPhamChiTiet?.ten_mau_sac,
                item.sanPhamChiTiet?.ten_kich_co
              ].filter(Boolean).join(' - '),
              price: item.gia_sau_giam_gia ?? item.don_gia,
              originalPrice: item.don_gia,
              quantity: item.so_luong,
              total: item.thanh_tien
            })),
            selectedCustomer: chiTiet.khachHang ? {
              id_khach_hang: chiTiet.khachHang.id_khach_hang,
              ma_khach_hang: chiTiet.khachHang.ma_khach_hang,
              ten_khach_hang: chiTiet.khachHang.ten_khach_hang,
              so_dien_thoai: chiTiet.khachHang.sdt_khach_hang,
              trang_thai: 'HoatDong'
            } : null
          };
          return newOrders;
        });
      } catch (err) {
        console.error('Error loading order details:', err);
        toast.error('Không thể tải thông tin hóa đơn');
      }
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
