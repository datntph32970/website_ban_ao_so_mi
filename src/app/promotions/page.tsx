"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Edit, Plus, Search, Trash } from "lucide-react";

// Interface cho dữ liệu khuyến mãi
interface Promotion {
  id: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  description: string;
  discountType: 'percentage' | 'fixed'; // Phần trăm hoặc giá trị cố định
  value: number;
  maxValue: number;
  minValue: number;
  status: boolean;
  createdAt: Date;
}

// Interface cho dữ liệu phiếu giảm giá
interface Voucher {
  id: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  description: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  maxValue: number;
  minValue: number;
  maxQuantity: number;
  usedQuantity: number;
  status: boolean;
  createdAt: Date;
}

// Dữ liệu mẫu cho khuyến mãi
const mockPromotions: Promotion[] = [
  {
    id: "1",
    name: "Khuyến mãi mùa hè",
    code: "SUMMER2025",
    startDate: new Date(2025, 5, 1), // 1/6/2025
    endDate: new Date(2025, 7, 31), // 31/8/2025
    description: "Giảm giá cho tất cả sản phẩm mùa hè",
    discountType: 'percentage',
    value: 15,
    maxValue: 500000,
    minValue: 100000,
    status: true,
    createdAt: new Date(2025, 4, 15)
  },
  {
    id: "2",
    name: "Khuyến mãi sinh nhật cửa hàng",
    code: "BIRTHDAY2025",
    startDate: new Date(2025, 3, 1), // 1/4/2025
    endDate: new Date(2025, 3, 15), // 15/4/2025
    description: "Giảm giá nhân dịp sinh nhật cửa hàng",
    discountType: 'percentage',
    value: 20,
    maxValue: 1000000,
    minValue: 200000,
    status: false,
    createdAt: new Date(2025, 2, 20)
  },
  {
    id: "3",
    name: "Giảm giá cố định",
    code: "FIXED100K",
    startDate: new Date(2025, 0, 1), // 1/1/2025
    endDate: new Date(2025, 11, 31), // 31/12/2025
    description: "Giảm 100.000đ cho đơn hàng từ 500.000đ",
    discountType: 'fixed',
    value: 100000,
    maxValue: 100000,
    minValue: 500000,
    status: true,
    createdAt: new Date(2024, 11, 15)
  }
];

// Dữ liệu mẫu cho phiếu giảm giá
const mockVouchers: Voucher[] = [
  {
    id: "1",
    name: "Phiếu giảm giá khách hàng mới",
    code: "NEWUSER100K",
    startDate: new Date(2025, 0, 1), // 1/1/2025
    endDate: new Date(2025, 11, 31), // 31/12/2025
    description: "Giảm 100.000đ cho khách hàng mới",
    discountType: 'fixed',
    value: 100000,
    maxValue: 100000,
    minValue: 500000,
    maxQuantity: 1000,
    usedQuantity: 243,
    status: true,
    createdAt: new Date(2024, 11, 15)
  },
  {
    id: "2",
    name: "Phiếu giảm 10% cho khách VIP",
    code: "VIP10",
    startDate: new Date(2025, 0, 1), // 1/1/2025
    endDate: new Date(2025, 11, 31), // 31/12/2025
    description: "Giảm 10% cho khách hàng VIP",
    discountType: 'percentage',
    value: 10,
    maxValue: 300000,
    minValue: 200000,
    maxQuantity: 500,
    usedQuantity: 89,
    status: true,
    createdAt: new Date(2024, 11, 20)
  }
];

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<'promotions' | 'vouchers'>('promotions');
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [searchTerm, setSearchTerm] = useState("");

  // State cho dialog thêm/sửa
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const [currentVoucher, setCurrentVoucher] = useState<Voucher | null>(null);

  // State cho form nhập liệu
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    startDate: new Date(),
    endDate: addDays(new Date(), 30),
    description: "",
    discountType: "percentage",
    value: 0,
    maxValue: 0,
    minValue: 0,
    maxQuantity: 0,
    status: true
  });

  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredPromotions = promotions.filter(promo =>
    promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVouchers = vouchers.filter(voucher =>
    voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      startDate: new Date(),
      endDate: addDays(new Date(), 30),
      description: "",
      discountType: "percentage",
      value: 0,
      maxValue: 0,
      minValue: 0,
      maxQuantity: 0,
      status: true
    });
  };

  // Kiểm tra trạng thái khuyến mãi
  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    if (!promotion.status) return "inactive";
    if (now < promotion.startDate) return "upcoming";
    if (now > promotion.endDate) return "expired";
    return "active";
  };

  // Kiểm tra trạng thái phiếu giảm giá
  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    if (!voucher.status) return "inactive";
    if (voucher.usedQuantity >= voucher.maxQuantity) return "used";
    if (now < voucher.startDate) return "upcoming";
    if (now > voucher.endDate) return "expired";
    return "active";
  };

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Đang hoạt động</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800">Sắp diễn ra</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Đã kết thúc</Badge>;
      case "inactive":
        return <Badge className="bg-slate-100 text-slate-800">Không hoạt động</Badge>;
      case "used":
        return <Badge className="bg-purple-100 text-purple-800">Đã sử dụng hết</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800">Không xác định</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {activeTab === 'promotions' ? 'Quản lý khuyến mãi' : 'Quản lý phiếu giảm giá'}
          </h1>
          <p className="text-slate-500">
            {activeTab === 'promotions'
              ? 'Quản lý các chương trình khuyến mãi cho sản phẩm'
              : 'Quản lý các phiếu giảm giá cho khách hàng'}
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Thêm {activeTab === 'promotions' ? 'khuyến mãi' : 'phiếu giảm giá'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'promotions' | 'vouchers')}
          >
            <TabsList>
              <TabsTrigger value="promotions">Khuyến mãi</TabsTrigger>
              <TabsTrigger value="vouchers">Phiếu giảm giá</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                className="pl-10"
                placeholder={`Tìm kiếm ${activeTab === 'promotions' ? 'khuyến mãi' : 'phiếu giảm giá'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {activeTab === 'promotions' ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên khuyến mãi</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                        Không tìm thấy khuyến mãi nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPromotions.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{promotion.name}</p>
                            <p className="text-xs text-slate-500">{promotion.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{promotion.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs">Từ: {format(promotion.startDate, 'dd/MM/yyyy')}</p>
                            <p className="text-xs">Đến: {format(promotion.endDate, 'dd/MM/yyyy')}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {promotion.discountType === 'percentage'
                            ? `${promotion.value}% (tối đa ${promotion.maxValue.toLocaleString('vi-VN')}đ)`
                            : `${promotion.value.toLocaleString('vi-VN')}đ`}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(getPromotionStatus(promotion))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setCurrentPromotion(promotion);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => {
                                setCurrentPromotion(promotion);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên phiếu giảm giá</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                        Không tìm thấy phiếu giảm giá nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVouchers.map((voucher) => (
                      <TableRow key={voucher.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{voucher.name}</p>
                            <p className="text-xs text-slate-500">{voucher.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{voucher.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs">Từ: {format(voucher.startDate, 'dd/MM/yyyy')}</p>
                            <p className="text-xs">Đến: {format(voucher.endDate, 'dd/MM/yyyy')}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {voucher.discountType === 'percentage'
                            ? `${voucher.value}% (tối đa ${voucher.maxValue.toLocaleString('vi-VN')}đ)`
                            : `${voucher.value.toLocaleString('vi-VN')}đ`}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs">{voucher.usedQuantity}/{voucher.maxQuantity}</p>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${(voucher.usedQuantity / voucher.maxQuantity) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(getVoucherStatus(voucher))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setCurrentVoucher(voucher);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => {
                                setCurrentVoucher(voucher);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
