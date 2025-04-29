"use client";

import { useState } from "react";
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
import { Eye, Search, Package, Clock, CheckCircle2, XCircle } from "lucide-react";

// Danh sách đơn hàng giả định
const mockOrders = [
  {
    id: "ORD-001",
    customerName: "Nguyễn Văn X",
    email: "nguyenvanx@example.com",
    date: "15/03/2024",
    total: 5200000,
    status: "completed",
    items: [
      { id: 1, name: "Nike Air Force 1", price: 2500000, quantity: 1 },
      { id: 2, name: "Adidas Ultraboost 21", price: 3200000, quantity: 1 },
    ]
  },
  {
    id: "ORD-002",
    customerName: "Trần Thị Y",
    email: "tranthiy@example.com",
    date: "16/03/2024",
    total: 3600000,
    status: "processing",
    items: [
      { id: 3, name: "Vans Old Skool", price: 1800000, quantity: 2 },
    ]
  },
  {
    id: "ORD-003",
    customerName: "Lê Văn Z",
    email: "levanz@example.com",
    date: "17/03/2024",
    total: 1500000,
    status: "shipping",
    items: [
      { id: 4, name: "Converse Chuck Taylor", price: 1500000, quantity: 1 },
    ]
  },
  {
    id: "ORD-004",
    customerName: "Phạm Thị W",
    email: "phamthiw@example.com",
    date: "18/03/2024",
    total: 4200000,
    status: "cancelled",
    items: [
      { id: 5, name: "New Balance 574", price: 2100000, quantity: 2 },
    ]
  },
  {
    id: "ORD-005",
    customerName: "Hoàng Văn V",
    email: "hoangvanv@example.com",
    date: "19/03/2024",
    total: 2500000,
    status: "completed",
    items: [
      { id: 1, name: "Nike Air Force 1", price: 2500000, quantity: 1 },
    ]
  },
];

// Trạng thái đơn hàng
const orderStatus = {
  processing: {
    label: "Đang xử lý",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-4 w-4 mr-1" />
  },
  shipping: {
    label: "Đang giao hàng",
    color: "bg-blue-100 text-blue-800",
    icon: <Package className="h-4 w-4 mr-1" />
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle2 className="h-4 w-4 mr-1" />
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-4 w-4 mr-1" />
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<(typeof mockOrders)[0] | null>(null);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);

  // Lọc đơn hàng theo từ khóa tìm kiếm
  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewOrder = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
    setIsViewOrderOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý đơn hàng</h1>
          <p className="text-slate-500">Xem và quản lý đơn hàng của cửa hàng</p>
        </div>
      </div>

      <div className="mb-6 flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            className="pl-10"
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">Lọc theo trạng thái</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                  Không tìm thấy đơn hàng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell className="text-right font-medium">
                    {order.total.toLocaleString('vi-VN')}₫
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center w-fit mx-auto ${orderStatus[order.status as keyof typeof orderStatus].color}`}>
                      {orderStatus[order.status as keyof typeof orderStatus].icon}
                      {orderStatus[order.status as keyof typeof orderStatus].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
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

      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        {selectedOrder && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Chi tiết đơn hàng #{selectedOrder.id}</DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Thông tin khách hàng</h3>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm">{selectedOrder.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Thông tin đơn hàng</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">Trạng thái:</p>
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center ${orderStatus[selectedOrder.status as keyof typeof orderStatus].color}`}>
                      {orderStatus[selectedOrder.status as keyof typeof orderStatus].icon}
                      {orderStatus[selectedOrder.status as keyof typeof orderStatus].label}
                    </span>
                  </div>
                  <p className="text-sm">Ngày đặt: {selectedOrder.date}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Sản phẩm đặt mua</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{item.price.toLocaleString('vi-VN')}₫</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between border-t pt-4">
                <span className="font-medium">Tổng cộng</span>
                <span className="font-bold text-xl">{selectedOrder.total.toLocaleString('vi-VN')}₫</span>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                {selectedOrder.status === "processing" && (
                  <Button variant="outline" className="gap-1">
                    <Package className="h-4 w-4" />
                    <span>Xác nhận giao hàng</span>
                  </Button>
                )}
                {selectedOrder.status === "shipping" && (
                  <Button variant="outline" className="gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Xác nhận hoàn thành</span>
                  </Button>
                )}
                {(selectedOrder.status === "processing" || selectedOrder.status === "shipping") && (
                  <Button variant="destructive" className="gap-1">
                    <XCircle className="h-4 w-4" />
                    <span>Hủy đơn hàng</span>
                  </Button>
                )}
                <Button onClick={() => setIsViewOrderOpen(false)}>Đóng</Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}
