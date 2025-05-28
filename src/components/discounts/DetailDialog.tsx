"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { GiamGia } from "@/types/giam-gia";
import {  Trash, Copy, Package, Plus, TrendingUp, DollarSign, Clock, X } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SanPhamGiamGiaDTO } from "@/services/giam-gia.service";
import { giamGiaService } from "@/services/giam-gia.service";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { AddProductsDialog } from "./AddProductsDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

interface SanPhamChiTiet {
  id_san_pham_chi_tiet: string;
  ma_san_pham_chi_tiet: string;
  ten_mau_sac: string;
  ten_kich_co: string;
  gia_ban: number;
}

interface DetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  discount: GiamGia | null;
  fetchDiscounts: () => void;
}

// Get status badge
const getStatusBadge = (discount: GiamGia | null) => {
  if (!discount) return null;
  
  const now = new Date();
  const startDate = new Date(discount.thoi_gian_bat_dau);
  const endDate = new Date(discount.thoi_gian_ket_thuc);

  // Trạng thái hoạt động
  const activityStatus = discount.trang_thai === "HoatDong"
    ? { label: "Hoạt động", color: "bg-green-100 text-green-800" }
    : { label: "Ngừng hoạt động", color: "bg-slate-100 text-slate-800" };

  // Trạng thái thời gian
  let timeStatus;
  if (now < startDate) {
    const timeLeft = startDate.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    timeStatus = { 
      label: `Bắt đầu sau ${daysLeft} ngày ${hoursLeft} giờ ${minutesLeft} phút`, 
      color: "bg-blue-100 text-blue-800"
    };
  } else if (now > endDate) {
    timeStatus = { label: "Đã kết thúc", color: "bg-red-100 text-red-800" };
  } else {
    const timeLeft = endDate.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    timeStatus = { 
      label: `Còn ${daysLeft} ngày ${hoursLeft} giờ ${minutesLeft} phút`, 
      color: "bg-yellow-100 text-yellow-800" 
    };
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={timeStatus.color}>
        {timeStatus.label}
      </Badge>
      <Badge className={activityStatus.color}>
        {activityStatus.label}
      </Badge>
    </div>
  );
};

export const DetailDialog: React.FC<DetailDialogProps> = ({
  isOpen,
  onClose,
  discount,
  fetchDiscounts
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<SanPhamGiamGiaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const fetchAvailableProducts = async () => {
    if (!discount) return;
    setLoading(true);
    try {
      const products = await giamGiaService.getSanPhamDangGiamGia(discount.id_giam_gia, {
        trang_hien_tai: 1,
        so_phan_tu_tren_trang: 10,
        tim_kiem: "",
        sap_xep_theo: "",
        sap_xep_tang: false,
        id_thuong_hieu: [],
        id_danh_muc: [],
        id_kieu_dang: [],
        id_chat_lieu: [],
        id_xuat_xu: [],
        gia_tu: undefined,
        gia_den: undefined
      });
      setAvailableProducts(products.danh_sach as unknown as SanPhamGiamGiaDTO[]);
    } catch (error) {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "products" && isOpen && discount) {
      fetchAvailableProducts();
    }
  }, [activeTab, isOpen, discount]);

  const handleAddProducts = async (productDetailIds: string[]) => {
    await fetchDiscounts();
    await fetchAvailableProducts();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVariantIds = availableProducts.flatMap(p => 
        p.sanPhamChiTiets.map(v => v.id_san_pham_chi_tiet)
      );
      setSelectedProducts(allVariantIds);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, isVariant: boolean = false) => {
    if (isVariant) {
      setSelectedProducts(prev => {
        if (prev.includes(productId)) {
          return prev.filter(id => id !== productId);
        }
        return [...prev, productId];
      });
    } else {
      const product = availableProducts.find(p => p.id_san_pham === productId);
      if (!product) return;
      
      const variantIds = product.sanPhamChiTiets.map(v => v.id_san_pham_chi_tiet);
      setSelectedProducts(prev => {
        const allSelected = variantIds.every(id => prev.includes(id));
        if (allSelected) {
          return prev.filter(id => !variantIds.includes(id));
        }
        return [...new Set([...prev, ...variantIds])];
      });
    }
  };

  const handleToggleExpand = (productId: string) => {
    setExpandedProduct(prev => prev === productId ? null : productId);
  };

  const handleRemoveSelected = async () => {
    if (selectedProducts.length === 0 || !discount) return;
    try {
      await giamGiaService.xoaGiamGiaKhoiSanPhamChiTiet({ 
        id_giam_gia: discount.id_giam_gia,
        san_pham_chi_tiet_ids: selectedProducts 
      });
      await fetchAvailableProducts();
      setSelectedProducts([]);
      toast.success("Đã xóa khuyến mại khỏi các sản phẩm đã chọn");
    } catch (error) {
      toast.error("Không thể xóa khuyến mại khỏi sản phẩm");
    }
  };

  const handleCopyCode = () => {
    if (discount?.ma_giam_gia) {
      navigator.clipboard.writeText(discount.ma_giam_gia);
      toast.success('Đã sao chép mã khuyến mại');
    }
  };

  if (!discount) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Chi tiết khuyến mại</span>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyCode}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sao chép mã khuyến mại</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </DialogTitle>
          </DialogHeader>

          {discount && (
            <div className="space-y-6 overflow-y-auto flex-1 pr-2">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tổng quan
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Sản phẩm áp dụng
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Basic info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Tên khuyến mại</h3>
                            <p className="text-lg font-medium">{discount.ten_giam_gia}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Mã khuyến mại</h3>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-slate-100 rounded text-sm">
                                {discount.ma_giam_gia}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCopyCode}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Mô tả</h3>
                            <p className="text-sm text-slate-600">{discount.mo_ta}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Giá trị giảm</h3>
                            <div className="flex items-center gap-2">
                              <Badge className="text-lg">
                                {discount.kieu_giam_gia === 'PhanTram' 
                                  ? `${discount.gia_tri_giam}%`
                                  : `${formatCurrency(discount.gia_tri_giam)}đ`
                                }
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Thời gian áp dụng</h3>
                            <div className="text-sm text-slate-600">
                              <p>Từ: {format(new Date(discount.thoi_gian_bat_dau), 'dd/MM/yyyy HH:mm')}</p>
                              <p>Đến: {format(new Date(discount.thoi_gian_ket_thuc), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Trạng thái</h3>
                            {getStatusBadge(discount)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Số lượng đã sử dụng</p>
                            <h3 className="text-2xl font-bold mt-1">
                              {discount.so_luong_da_su_dung || 0}
                            </h3>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-full">
                            <Package className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                              style={{
                                width: '100%'
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Đã sử dụng
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Thời gian còn lại</p>
                            <h3 className="text-2xl font-bold mt-1">
                              {(() => {
                                const now = new Date();
                                const end = new Date(discount.thoi_gian_ket_thuc);
                                const diff = end.getTime() - now.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                return `${days} ngày ${hours} giờ`;
                              })()}
                            </h3>
                          </div>
                          <div className="p-3 bg-yellow-100 rounded-full">
                            <Clock className="h-6 w-6 text-yellow-600" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-yellow-600 transition-all duration-300"
                              style={{
                                width: `${(() => {
                                  const now = new Date();
                                  const start = new Date(discount.thoi_gian_bat_dau);
                                  const end = new Date(discount.thoi_gian_ket_thuc);
                                  const total = end.getTime() - start.getTime();
                                  const elapsed = now.getTime() - start.getTime();
                                  return Math.min(100, Math.max(0, (elapsed / total) * 100));
                                })()}%`
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {Math.round((() => {
                              const now = new Date();
                              const start = new Date(discount.thoi_gian_bat_dau);
                              const end = new Date(discount.thoi_gian_ket_thuc);
                              const total = end.getTime() - start.getTime();
                              const elapsed = now.getTime() - start.getTime();
                              return Math.min(100, Math.max(0, (elapsed / total) * 100));
                            })())}% thời gian đã trôi qua
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Trạng thái</p>
                            <h3 className="text-2xl font-bold mt-1">
                              {discount.trang_thai === 'HoatDong' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                            </h3>
                          </div>
                          <div className="p-3 bg-green-100 rounded-full">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-slate-500">
                            Thời gian bắt đầu: {format(new Date(discount.thoi_gian_bat_dau), 'dd/MM/yyyy HH:mm')}
                          </p>
                          <p className="text-sm text-slate-500">
                            Thời gian kết thúc: {format(new Date(discount.thoi_gian_ket_thuc), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="products">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Sản phẩm đang áp dụng</h3>
                      <div className="flex items-center gap-2">
                        {selectedProducts.length > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveSelected}
                            className="flex items-center gap-2"
                          >
                            <Trash className="h-4 w-4" />
                            Xóa ({selectedProducts.length})
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddProductOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Thêm sản phẩm
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox
                                checked={availableProducts.length > 0 && selectedProducts.length === availableProducts.length}
                                onCheckedChange={handleSelectAll}
                                aria-label="Chọn tất cả sản phẩm"
                              />
                            </TableHead>
                            <TableHead>Tên sản phẩm</TableHead>
                            <TableHead>Mã sản phẩm</TableHead>
                            <TableHead>Giá gốc</TableHead>
                            <TableHead>Giá sau giảm</TableHead>
                            <TableHead>Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : availableProducts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                  <Package className="h-10 w-10" />
                                  <p>Chưa có sản phẩm nào được áp dụng</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddProductOpen(true)}
                                    className="mt-2"
                                  >
                                    Thêm sản phẩm
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            <>
                              {expandedProduct ? (
                                // Show only expanded product
                                availableProducts
                                  .filter((product: SanPhamGiamGiaDTO) => product.id_san_pham === expandedProduct)
                                  .map((product: SanPhamGiamGiaDTO) => (
                                    <React.Fragment key={product.id_san_pham}>
                                      <TableRow 
                                        className="bg-slate-50 cursor-pointer hover:bg-slate-100"
                                        onClick={() => setExpandedProduct(null)}
                                      >
                                        <TableCell onClick={e => e.stopPropagation()}>
                                          <Checkbox
                                            checked={product.sanPhamChiTiets.every((v: SanPhamChiTiet) => selectedProducts.includes(v.id_san_pham_chi_tiet))}
                                            onCheckedChange={(checked) => handleSelectProduct(product.id_san_pham)}
                                            aria-label={`Chọn sản phẩm ${product.ten_san_pham}`}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            {product.url_anh_mac_dinh && (
                                              <Image 
                                                src={getImageUrl(product.url_anh_mac_dinh)} 
                                                alt={product.ten_san_pham}
                                                width={40}
                                                height={40}
                                                className="object-cover rounded"
                                              />
                                            )}
                                            <span>{product.ten_san_pham}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <code className="px-2 py-1 bg-slate-100 rounded text-sm">
                                            {product.ma_san_pham}
                                          </code>
                                        </TableCell>
                                        <TableCell>{product.sanPhamChiTiets[0].gia_ban.toLocaleString('vi-VN')}đ</TableCell>
                                        <TableCell>
                                          {discount.kieu_giam_gia === 'PhanTram'
                                            ? (product.sanPhamChiTiets[0].gia_ban * (1 - discount.gia_tri_giam / 100)).toLocaleString('vi-VN')
                                            : (product.sanPhamChiTiets[0].gia_ban - discount.gia_tri_giam).toLocaleString('vi-VN')
                                          }đ
                                        </TableCell>
                                        <TableCell>
                                          <Badge className={product.trang_thai === "HoatDong" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                            {product.trang_thai === "HoatDong" ? "Hoạt động" : "Ngừng hoạt động"}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell colSpan={6} className="p-0">
                                          <div className="bg-slate-50 p-4">
                                            <div className="space-y-4">
                                              <div className="flex items-center justify-between">
                                                <h4 className="font-medium">Các phiên bản</h4>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setExpandedProduct(null)}
                                                  className="text-slate-500 hover:text-slate-700"
                                                >
                                                  <X className="h-4 w-4 mr-2" />
                                                  Đóng
                                                </Button>
                                              </div>
                                              <div className="grid gap-4">
                                                {product.sanPhamChiTiets.map((variant: SanPhamChiTiet, index: number) => (
                                                  <div 
                                                    key={variant.id_san_pham_chi_tiet}
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all duration-200 animate-in fade-in duration-300"
                                                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                                                  >
                                                    <div className="flex items-center gap-4">
                                                      <div className="w-8 h-8 relative">
                                                        <Image
                                                          src={getImageUrl(product.url_anh_mac_dinh)}
                                                          alt={variant.ma_san_pham_chi_tiet}
                                                          width={32}
                                                          height={32}
                                                          className="w-full h-full object-cover rounded transition-transform duration-200 hover:scale-110"
                                                        />
                                                      </div>
                                                      <div>
                                                        <p className="font-medium">
                                                          {variant.ten_mau_sac} - {variant.ten_kich_co}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                          Mã: {variant.ma_san_pham_chi_tiet}
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                      <div className="text-right">
                                                        <p className="font-medium">{variant.gia_ban.toLocaleString('vi-VN')}đ</p>
                                                        <p className="text-sm text-slate-500">
                                                          {discount.kieu_giam_gia === 'PhanTram'
                                                            ? (variant.gia_ban * (1 - discount.gia_tri_giam / 100)).toLocaleString('vi-VN')
                                                            : (variant.gia_ban - discount.gia_tri_giam).toLocaleString('vi-VN')
                                                          }đ
                                                        </p>
                                                      </div>
                                                      <Checkbox
                                                        checked={selectedProducts.includes(variant.id_san_pham_chi_tiet)}
                                                        onCheckedChange={() => handleSelectProduct(variant.id_san_pham_chi_tiet, true)}
                                                        aria-label={`Chọn phiên bản ${variant.ten_mau_sac} - ${variant.ten_kich_co}`}
                                                      />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    </React.Fragment>
                                  ))
                              ) : (
                                // Show all products
                                availableProducts.map((product: SanPhamGiamGiaDTO) => (
                                  <TableRow 
                                    key={product.id_san_pham}
                                    className="cursor-pointer hover:bg-slate-50"
                                    onClick={() => setExpandedProduct(product.id_san_pham)}
                                  >
                                    <TableCell onClick={e => e.stopPropagation()}>
                                      <Checkbox
                                        checked={product.sanPhamChiTiets.every((v: SanPhamChiTiet) => selectedProducts.includes(v.id_san_pham_chi_tiet))}
                                        onCheckedChange={(checked) => handleSelectProduct(product.id_san_pham)}
                                        aria-label={`Chọn sản phẩm ${product.ten_san_pham}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {product.url_anh_mac_dinh && (
                                          <Image 
                                            src={getImageUrl(product.url_anh_mac_dinh)} 
                                            alt={product.ten_san_pham}
                                            width={40}
                                            height={40}
                                            className="object-cover rounded"
                                          />
                                        )}
                                        <span>{product.ten_san_pham}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <code className="px-2 py-1 bg-slate-100 rounded text-sm">
                                        {product.ma_san_pham}
                                      </code>
                                    </TableCell>
                                    <TableCell>{product.sanPhamChiTiets[0].gia_ban.toLocaleString('vi-VN')}đ</TableCell>
                                    <TableCell>
                                      {discount.kieu_giam_gia === 'PhanTram'
                                        ? (product.sanPhamChiTiets[0].gia_ban * (1 - discount.gia_tri_giam / 100)).toLocaleString('vi-VN')
                                        : (product.sanPhamChiTiets[0].gia_ban - discount.gia_tri_giam).toLocaleString('vi-VN')
                                      }đ
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={product.trang_thai === "HoatDong" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                        {product.trang_thai === "HoatDong" ? "Hoạt động" : "Ngừng hoạt động"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action buttons */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Handle edit
                  }}
                >
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddProductsDialog
        discountId={discount?.id_giam_gia || ""}
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onSuccess={fetchAvailableProducts}
        fetchProducts={giamGiaService.getSanPhamCoTheGiamGia}
      />
    </>
  );
}; 