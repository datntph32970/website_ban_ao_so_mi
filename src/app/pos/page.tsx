"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ShoppingCart, Plus, Minus, Trash, CreditCard, DollarSign, Printer } from "lucide-react";
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

// Danh sách sản phẩm giày giả định
const mockProducts = [
  {
    id: 1,
    name: "Nike Air Force 1",
    category: "Giày thể thao",
    price: 2500000,
    stock: 25,
    imageUrl: "/products/shoe1.jpg",
  },
  {
    id: 2,
    name: "Adidas Ultraboost 21",
    category: "Giày chạy bộ",
    price: 3200000,
    stock: 18,
    imageUrl: "/products/shoe2.jpg",
  },
  {
    id: 3,
    name: "Vans Old Skool",
    category: "Giày thời trang",
    price: 1800000,
    stock: 32,
    imageUrl: "/products/shoe3.jpg",
  },
  {
    id: 4,
    name: "Converse Chuck Taylor",
    category: "Giày thời trang",
    price: 1500000,
    stock: 45,
    imageUrl: "/products/shoe4.jpg",
  },
  {
    id: 5,
    name: "New Balance 574",
    category: "Giày thể thao",
    price: 2100000,
    stock: 20,
    imageUrl: "/products/shoe5.jpg",
  },
  {
    id: 6,
    name: "Nike Air Max 90",
    category: "Giày thể thao",
    price: 2800000,
    stock: 15,
    imageUrl: "/products/shoe6.jpg",
  },
  {
    id: 7,
    name: "Puma Suede Classic",
    category: "Giày thời trang",
    price: 1700000,
    stock: 22,
    imageUrl: "/products/shoe7.jpg",
  },
  {
    id: 8,
    name: "Reebok Classic Leather",
    category: "Giày thời trang",
    price: 1900000,
    stock: 28,
    imageUrl: "/products/shoe8.jpg",
  },
];

// Phương thức thanh toán
const paymentMethods = [
  { id: "cash", name: "Tiền mặt", icon: <DollarSign className="h-5 w-5" /> },
  { id: "card", name: "Thẻ tín dụng/ghi nợ", icon: <CreditCard className="h-5 w-5" /> },
];

// Interface cho giỏ hàng
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export default function POSPage() {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  });
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tính tổng tiền giỏ hàng
  const cartTotal = cart.reduce((total, item) => total + item.total, 0);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = (product: typeof mockProducts[0]) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => item.id === product.id);

      if (existingItemIndex >= 0) {
        // Sản phẩm đã có trong giỏ hàng, tăng số lượng
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += 1;
        newCart[existingItemIndex].total = newCart[existingItemIndex].quantity * newCart[existingItemIndex].price;
        return newCart;
      } else {
        // Thêm sản phẩm mới vào giỏ hàng
        return [...prev, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price
        }];
      }
    });
  };

  // Thay đổi số lượng sản phẩm trong giỏ hàng
  const updateCartItemQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      // Cập nhật số lượng sản phẩm
      setCart(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
            : item
        )
      );
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Xử lý thanh toán
  const handlePayment = () => {
    // Tạo ID đơn hàng
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    setCurrentOrderId(orderId);

    // Xóa giỏ hàng và đóng dialog thanh toán
    setIsPaymentOpen(false);
    // Hiển thị hóa đơn
    setReceiptOpen(true);
  };

  // Hoàn tất đơn hàng
  const completeOrder = () => {
    setCart([]);
    setCustomerInfo({
      name: "",
      phone: "",
    });
    setReceiptOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bán hàng tại quầy</h1>
          <p className="text-slate-500">Tạo đơn hàng và thanh toán trực tiếp tại cửa hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phần danh sách sản phẩm - 2 cột */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                className="pl-10"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">Thể loại</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => addToCart(product)}>
                <CardContent className="p-4">
                  <div className="h-32 bg-slate-100 rounded-md mb-3 flex items-center justify-center">
                    <div className="font-bold text-slate-400">Ảnh</div>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-slate-500 text-xs">{product.category}</p>
                    <p className="font-bold text-sm">{product.price.toLocaleString('vi-VN')}₫</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Phần giỏ hàng - 1 cột */}
        <div className="lg:col-span-1">
          <Card className="sticky top-[80px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Giỏ hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p>Giỏ hàng trống</p>
                    <p className="text-xs mt-1">Chọn sản phẩm để thêm vào giỏ hàng</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center border-b border-slate-100 pb-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-slate-500 text-xs">{item.price.toLocaleString('vi-VN')}₫</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="ml-4 w-20 text-right">
                            <p className="font-bold text-sm">{item.total.toLocaleString('vi-VN')}₫</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Tổng tiền hàng</span>
                        <span className="font-medium">{cartTotal.toLocaleString('vi-VN')}₫</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Thuế (10%)</span>
                        <span className="font-medium">{(cartTotal * 0.1).toLocaleString('vi-VN')}₫</span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-bold">Tổng thanh toán</span>
                        <span className="font-bold text-lg">{(cartTotal * 1.1).toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setCart([])}>
                        Hủy
                      </Button>
                      <Button className="flex-1" onClick={() => setIsPaymentOpen(true)}>
                        Thanh toán
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog thanh toán */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thanh toán đơn hàng</DialogTitle>
            <DialogDescription>Nhập thông tin khách hàng và chọn phương thức thanh toán</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="customer-name" className="text-sm font-medium">
                Tên khách hàng
              </label>
              <Input
                id="customer-name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                placeholder="Nhập tên khách hàng"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customer-phone" className="text-sm font-medium">
                Số điện thoại
              </label>
              <Input
                id="customer-phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${
                      paymentMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    {method.icon}
                    <span>{method.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="flex justify-between items-center font-bold">
                <span>Tổng thanh toán</span>
                <span className="text-lg">{(cartTotal * 1.1).toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Hủy</Button>
            <Button onClick={handlePayment}>Hoàn tất thanh toán</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog hóa đơn */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center">Hóa đơn thanh toán</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg">Shoes Store</h3>
              <p className="text-sm text-slate-500">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
              <p className="text-sm text-slate-500">SĐT: 0912345678</p>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Mã đơn hàng:</span>
                <span className="font-medium">{currentOrderId}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Ngày:</span>
                <span>{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Khách hàng:</span>
                <span>{customerInfo.name || "Khách lẻ"}</span>
              </div>
              {customerInfo.phone && (
                <div className="flex justify-between text-sm mb-1">
                  <span>SĐT:</span>
                  <span>{customerInfo.phone}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-2">Sản phẩm</th>
                    <th className="text-center pb-2">SL</th>
                    <th className="text-right pb-2">Giá</th>
                    <th className="text-right pb-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-2">{item.name}</td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2">{item.price.toLocaleString('vi-VN')}₫</td>
                      <td className="text-right py-2">{item.total.toLocaleString('vi-VN')}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span>{cartTotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế (10%):</span>
                <span>{(cartTotal * 0.1).toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-2">
                <span>Tổng thanh toán:</span>
                <span>{(cartTotal * 1.1).toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between">
                <span>Phương thức thanh toán:</span>
                <span>{paymentMethod === "cash" ? "Tiền mặt" : "Thẻ tín dụng/ghi nợ"}</span>
              </div>
            </div>

            <div className="text-center text-sm text-slate-500 border-t border-dashed border-slate-200 pt-4">
              <p>Cảm ơn quý khách đã mua hàng!</p>
              <p>Hẹn gặp lại quý khách.</p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={completeOrder}>
              <Printer className="h-4 w-4" />
              <span>In hóa đơn</span>
            </Button>
            <Button className="flex-1" onClick={completeOrder}>
              Hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
