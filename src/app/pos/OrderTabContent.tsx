import React from "react";
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
// ... import các type và service cần thiết ...

// Hàm format giá tiền
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
  onPayment
}: OrderTabContentProps) {
  const updateOrderField = (field: string, value: any) => {
    onOrderChange({ ...order, [field]: value });
  };
  const cartTotal = order.cart.reduce((total: number, item: any) => total + item.total, 0);

  // Thêm các state cục bộ cho dialog chi tiết sản phẩm
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedColor(null);
    setSelectedSize(null);
  }, [order.selectedProduct]);

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
              />
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
                          <span className="text-sm font-bold text-slate-700">
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
                  />
                  {order.customerSearch && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-20 max-h-56 overflow-y-auto">
                      {customerOptions.length > 0 ? (
                        customerOptions.map((kh, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                            onClick={() => updateOrderField('selectedCustomer', kh)}
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
              <div className="space-y-4">
                {order.cart.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p>Giỏ hàng trống</p>
                    <p className="text-xs mt-1">Chọn sản phẩm để thêm vào giỏ hàng</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {order.cart.map((item: any, index: number) => (
                        <div key={index} className="flex items-center border-b border-slate-100 pb-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            {item.originalPrice > item.price ? (
                              <>
                                <span className="text-green-600 font-bold text-sm mr-2">
                                  {item.price.toLocaleString('vi-VN')}₫
                                </span>
                                <span className="text-xs text-slate-400 line-through">
                                  {item.originalPrice.toLocaleString('vi-VN')}₫
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-slate-700">
                                {item.price.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => {
                              console.log('Cart item data:', item);
                              onUpdateCartItemQuantity(item.id, item.id_san_pham_chi_tiet, item.quantity - 1);
                            }}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              className="w-16 h-7 text-center"
                              value={item.quantity || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Chỉ cho phép nhập số
                                if (/^\d*$/.test(value)) {
                                  const newQuantity = parseInt(value) || 0;
                                  if (newQuantity >= 0) {
                                    onUpdateCartItemQuantity(item.id, item.id_san_pham_chi_tiet, newQuantity);
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                            />
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => {
                              console.log('Cart item data:', item);
                              onUpdateCartItemQuantity(item.id, item.id_san_pham_chi_tiet, item.quantity + 1);
                            }}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => {
                              console.log('Cart item data:', item);
                              onUpdateCartItemQuantity(item.id, item.id_san_pham_chi_tiet, 0);
                            }}>
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="ml-4 w-20 text-right">
                            <p className="font-bold text-sm">{(item.total ?? 0).toLocaleString('vi-VN')}₫</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Tổng tiền hàng</span>
                        <span className="font-medium">{(cartTotal ?? 0).toLocaleString('vi-VN')}₫</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Thuế (10%)</span>
                        <span className="font-medium">{(cartTotal ? cartTotal * 0.1 : 0).toLocaleString('vi-VN')}₫</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-bold">Tổng thanh toán</span>
                        <span className="font-bold text-lg">{(cartTotal ? cartTotal * 1.1 : 0).toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1">Hủy</Button>
                      <Button className="flex-1" onClick={onPayment}>Thanh toán</Button>
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
                  max={5000000}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => updateOrderField('isFilterOpen', false)}>Đóng</Button>
            <Button onClick={() => updateOrderField('isFilterOpen', false)}>Áp dụng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thanh toán */}
      <Dialog open={order.isPaymentOpen} onOpenChange={value => updateOrderField('isPaymentOpen', value)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thanh toán đơn hàng</DialogTitle>
            <DialogDescription>Chọn phương thức thanh toán</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phương thức thanh toán</label>
              <div className="grid grid-cols-2 gap-3">
                {/* TODO: Render paymentMethods từ props nếu cần */}
                <div className="border rounded-lg p-3 cursor-pointer flex items-center gap-2 border-blue-600 bg-blue-50">
                  <DollarSign className="h-5 w-5" />
                  <span>Tiền mặt</span>
                </div>
                <div className="border rounded-lg p-3 cursor-pointer flex items-center gap-2 border-slate-200">
                  <CreditCard className="h-5 w-5" />
                  <span>Thẻ tín dụng/ghi nợ</span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="flex justify-between items-center font-bold">
                <span>Tổng thanh toán</span>
                <span className="text-lg">0₫</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => updateOrderField('isPaymentOpen', false)}>Hủy</Button>
            <Button>Hoàn tất thanh toán</Button>
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
                value={order.newCustomer?.ten_khach_hang || ''}
                onChange={e => updateOrderField('newCustomer', { ...order.newCustomer, ten_khach_hang: e.target.value })}
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={order.newCustomer?.so_dien_thoai || ''}
                onChange={e => updateOrderField('newCustomer', { ...order.newCustomer, so_dien_thoai: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => updateOrderField('isAddCustomerOpen', false)}>Hủy</Button>
            <Button>Thêm mới</Button>
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
                                    {variant.stock > 10 
                                      ? 'Còn nhiều' 
                                      : variant.stock > 0 
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
                              <span className="text-2xl font-bold text-green-600">
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
                        return order.selectedProduct?.discountInfo ? (
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
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-blue-600">
                            {formatCurrency(order.selectedProduct?.minPrice || 0)}
                            {order.selectedProduct?.minPrice !== order.selectedProduct?.maxPrice && 
                              ` - ${formatCurrency(order.selectedProduct?.maxPrice || 0)}`}
                          </span>
                        );
                      })()}
                      <span className="text-sm text-slate-500">/ sản phẩm</span>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!(selectedColor && selectedSize)}
                      onClick={() => {
                        if (selectedColor && selectedSize) {
                          const variant = order.selectedProduct?.variants.find(
                            (v: any) => v.color === selectedColor && v.size === selectedSize
                          );
                          console.log('Variant được chọn:', variant);
                          if (variant) {
                            onAddToCart(variant);
                            setTimeout(() => updateOrderField('selectedProduct', null), 100);
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
    </div>
  );
} 