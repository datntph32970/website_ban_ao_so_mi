"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Plus, Search, Check, X, Pencil, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { attributeService } from "@/services/attribute.service";
import { ChatLieu, CreateChatLieuDTO } from "@/types/chat-lieu";
import toast from 'react-hot-toast';

// Danh sách các loại thuộc tính
const attributeTypes = [
  {
    id: "ThuongHieu",
    name: "Thương hiệu",
  },
  {
    id: "KieuDang",
    name: "Kiểu dáng",
  },
  {
    id: "ChatLieu",
    name: "Chất liệu",
  },
  {
    id: "XuatXu",
    name: "Xuất xứ",
  },
  {
    id: "MauSac",
    name: "Màu sắc",
  },
  {
    id: "KichCo",
    name: "Kích cỡ",
  },
  {
    id: "DanhMuc",
    name: "Danh mục",
  },
];

type AttributeType = 'ThuongHieu' | 'KieuDang' | 'ChatLieu' | 'XuatXu' | 'MauSac' | 'KichCo' | 'DanhMuc';

const attributeFieldMappings = {
  ThuongHieu: {
    name: 'ten_thuong_hieu',
    description: 'mo_ta',
    id: 'id_thuong_hieu'
  },
  KieuDang: {
    name: 'ten_kieu_dang',
    description: 'mo_ta',
    id: 'id_kieu_dang'
  },
  ChatLieu: {
    name: 'ten_chat_lieu',
    description: 'mo_ta',
    id: 'id_chat_lieu'
  },
  XuatXu: {
    name: 'ten_xuat_xu',
    description: 'mo_ta',
    id: 'id_xuat_xu'
  },
  MauSac: {
    name: 'ten_mau_sac',
    description: 'mo_ta',
    id: 'id_mau_sac'
  },
  KichCo: {
    name: 'ten_kich_co',
    description: 'mo_ta',
    id: 'id_kich_co'
  },
  DanhMuc: {
    name: 'ten_danh_muc',
    description: 'mo_ta',
    id: 'id_danh_muc'
  }
} as const;

type AttributeFieldMapping = typeof attributeFieldMappings;
type AttributeFieldKey = keyof AttributeFieldMapping;

export default function AttributesPage() {
  const [activeTab, setActiveTab] = useState<AttributeType>("ThuongHieu");
  const [attributes, setAttributes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<any>(null);
  const [newAttribute, setNewAttribute] = useState<Record<string, string>>({
    [attributeFieldMappings[activeTab as AttributeFieldKey].name]: "",
    [attributeFieldMappings[activeTab as AttributeFieldKey].description]: "",
    trang_thai: "HoatDong"
  });

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingAttribute, setViewingAttribute] = useState<Record<string, any> | null>(null);

  // Thêm state cho dialog xóa
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAttribute, setDeletingAttribute] = useState<any>(null);

  // Load danh sách thuộc tính khi tab thay đổi
  useEffect(() => {
    loadAttributes();
  }, [activeTab]);

  // Hàm load danh sách thuộc tính
  const loadAttributes = async () => {
    try {
      setIsLoading(true);
      const data = await attributeService.getAttributes(activeTab);
      setAttributes(data as ChatLieu[]);
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || "Không thể tải danh sách thuộc tính");
      } else {
        toast.error("Không thể tải danh sách thuộc tính");
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter attributes based on search term and status
  const filteredAttributes = attributes.filter((attribute) => {
    const nameField = attributeFieldMappings[activeTab as AttributeFieldKey].name;
    const name = attribute[nameField]?.toLowerCase() || '';
    
    // Get the correct code field based on attribute type
    let code = '';
    switch (activeTab) {
      case 'ThuongHieu':
        code = attribute.ma_thuong_hieu?.toLowerCase() || '';
        break;
      case 'KieuDang':
        code = attribute.ma_kieu_dang?.toLowerCase() || '';
        break;
      case 'ChatLieu':
        code = attribute.ma_chat_lieu?.toLowerCase() || '';
        break;
      case 'XuatXu':
        code = attribute.ma_xuat_xu?.toLowerCase() || '';
        break;
      case 'MauSac':
        code = attribute.ma_mau_sac?.toLowerCase() || '';
        break;
      case 'KichCo':
        code = attribute.ma_kich_co?.toLowerCase() || '';
        break;
      case 'DanhMuc':
        code = attribute.ma_danh_muc?.toLowerCase() || '';
        break;
      default:
        code = '';
    }

    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = name.includes(searchTermLower) || code.includes(searchTermLower);
    const matchesStatus = statusFilter === "all" || attribute.trang_thai === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAttributes = filteredAttributes.slice(startIndex, startIndex + itemsPerPage);

  // Xử lý thêm thuộc tính mới
  const handleAddAttribute = async () => {
    if (!newAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name]) return;

    try {
      const attributeData = {
        [attributeFieldMappings[activeTab as AttributeFieldKey].name]: newAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name],
        [attributeFieldMappings[activeTab as AttributeFieldKey].description]: newAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].description],
        trang_thai: newAttribute.trang_thai
      } as any;
      
      await attributeService.createAttribute(activeTab, attributeData);
      toast.success("Thêm thuộc tính thành công");
      loadAttributes();
      setNewAttribute({
        [attributeFieldMappings[activeTab as AttributeFieldKey].name]: "",
        [attributeFieldMappings[activeTab as AttributeFieldKey].description]: "",
        trang_thai: "HoatDong"
      });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response.data || "Dữ liệu không hợp lệ");
      } else {
        toast.error("Không thể thêm thuộc tính");
      }
      console.error(error);
    }
  };

  // Xử lý chỉnh sửa thuộc tính
  const handleEditAttribute = async () => {
    if (!editingAttribute || !editingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name]) return;

    try {
      const attributeData = {
        [attributeFieldMappings[activeTab as AttributeFieldKey].name]: editingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name],
        [attributeFieldMappings[activeTab as AttributeFieldKey].description]: editingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].description],
        trang_thai: editingAttribute.trang_thai
      } as any;

      await attributeService.updateAttribute(
        activeTab, 
        editingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].id],
        attributeData
      );
      toast.success("Cập nhật thuộc tính thành công");
      loadAttributes();
      setEditingAttribute(null);
      setIsEditDialogOpen(false);
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response.data || "Dữ liệu không hợp lệ");
      } else {
        toast.error("Không thể cập nhật thuộc tính");
      }
      console.error(error);
    }
  };

  // Cập nhật hàm xử lý xóa
  const handleDeleteAttribute = async (id: number) => {
    try {
      await attributeService.deleteAttribute(activeTab, id);
      toast.success("Xóa thuộc tính thành công");
      loadAttributes();
      setIsDeleteDialogOpen(false);
      setDeletingAttribute(null);
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response.data || "Không thể xóa thuộc tính này");
      } else {
        toast.error("Không thể xóa thuộc tính");
      }
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý thuộc tính sản phẩm</h1>
            <p className="text-slate-500">Quản lý các thuộc tính cho sản phẩm </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách thuộc tính</CardTitle>
            <CardDescription>Quản lý các loại thuộc tính cho sản phẩm </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ThuongHieu" value={activeTab} onValueChange={(value) => {
              setActiveTab(value as AttributeType);
              setCurrentPage(1);
              setSearchTerm("");
            }}>
              <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-6">
                <TabsTrigger value="ThuongHieu">Thương hiệu</TabsTrigger>
                <TabsTrigger value="KieuDang">Kiểu dáng</TabsTrigger>
                <TabsTrigger value="ChatLieu">Chất liệu</TabsTrigger>
                <TabsTrigger value="XuatXu">Xuất xứ</TabsTrigger>
                <TabsTrigger value="DanhMuc">Danh mục</TabsTrigger>
                <TabsTrigger value="MauSac">Màu sắc</TabsTrigger>
                <TabsTrigger value="KichCo">Kích cỡ</TabsTrigger>
              </TabsList>

              {attributeTypes.map(type => (
                <TabsContent key={type.id} value={type.id} className="space-y-4">
                  <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        className="pl-10 pr-10"
                        placeholder={`Tìm kiếm ${type.name.toLowerCase()} theo tên hoặc mã...`}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setCurrentPage(1);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label="Xóa tìm kiếm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-slate-700">Trạng thái:</Label>
                      <div className="flex gap-2">
                        <div 
                          className={`flex items-center px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-all ${
                            statusFilter === "all" 
                              ? "border-blue-500 bg-blue-50" 
                              : "border-slate-200 hover:border-blue-200"
                          }`}
                          onClick={() => {
                            setStatusFilter("all");
                            setCurrentPage(1);
                          }}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border-2 mr-2 flex items-center justify-center ${
                            statusFilter === "all" 
                              ? "border-blue-500 bg-blue-500" 
                              : "border-slate-300"
                          }`}>
                            {statusFilter === "all" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-slate-700">Tất cả</div>
                        </div>
                        <div 
                          className={`flex items-center px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-all ${
                            statusFilter === "HoatDong" 
                              ? "border-blue-500 bg-blue-50" 
                              : "border-slate-200 hover:border-blue-200"
                          }`}
                          onClick={() => {
                            setStatusFilter("HoatDong");
                            setCurrentPage(1);
                          }}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border-2 mr-2 flex items-center justify-center ${
                            statusFilter === "HoatDong" 
                              ? "border-blue-500 bg-blue-500" 
                              : "border-slate-300"
                          }`}>
                            {statusFilter === "HoatDong" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-slate-700">Hoạt động</div>
                        </div>
                        <div 
                          className={`flex items-center px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-all ${
                            statusFilter === "KhongHoatDong" 
                              ? "border-red-500 bg-red-50" 
                              : "border-slate-200 hover:border-red-200"
                          }`}
                          onClick={() => {
                            setStatusFilter("KhongHoatDong");
                            setCurrentPage(1);
                          }}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border-2 mr-2 flex items-center justify-center ${
                            statusFilter === "KhongHoatDong" 
                              ? "border-red-500 bg-red-500" 
                              : "border-slate-300"
                          }`}>
                            {statusFilter === "KhongHoatDong" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-slate-700">Không hoạt động</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setNewAttribute({
                          [attributeFieldMappings[type.id as AttributeFieldKey].name]: "",
                          [attributeFieldMappings[type.id as AttributeFieldKey].description]: "",
                          trang_thai: "HoatDong"
                        });
                        setIsAddDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Thêm {type.name.toLowerCase()}</span>
                    </Button>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-[80px]">STT</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Mã</TableHead>
                          <TableHead>Mô tả</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">
                              Đang tải dữ liệu...
                            </TableCell>
                          </TableRow>
                        ) : paginatedAttributes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                              Không tìm thấy thuộc tính nào
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedAttributes.map((attribute, index) => (
                            <TableRow 
                              key={`${activeTab}-${attribute[attributeFieldMappings[activeTab as AttributeFieldKey].id] || 'none'}-${index}`}
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                              onClick={() => {
                                setViewingAttribute(attribute);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <TableCell>{startIndex + index + 1}</TableCell>
                              <TableCell className="font-medium">
                                {attribute[attributeFieldMappings[activeTab as AttributeFieldKey].name]}
                              </TableCell>
                              <TableCell>
                                {attribute.ma_chat_lieu || attribute.ma_thuong_hieu || attribute.ma_kieu_dang || 
                                 attribute.ma_xuat_xu || attribute.ma_mau_sac || attribute.ma_kich_co || attribute.ma_danh_muc}
                              </TableCell>
                              <TableCell>
                                {attribute[attributeFieldMappings[activeTab as AttributeFieldKey].description]}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  attribute.trang_thai === "HoatDong" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {attribute.trang_thai === "HoatDong" ? "Hoạt động" : "Không hoạt động"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-blue-500 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAttribute(attribute);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-500 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingAttribute(attribute);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {!isLoading && filteredAttributes.length > 0 && (
                    <div className="flex items-center justify-between px-2">
                      <div className="text-sm text-slate-500">
                        Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAttributes.length)} của {filteredAttributes.length} thuộc tính
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Trước
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={currentPage === page ? "bg-blue-600" : ""}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Thêm {attributeTypes.find(type => type.id === activeTab)?.name}</DialogTitle>
              <DialogDescription>
                Nhập thông tin {attributeTypes.find(type => type.id === activeTab)?.name} mới
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="attr-name">Tên {attributeTypes.find(type => type.id === activeTab)?.name} <span className="text-red-500">*</span></Label>
                <Input
                  id="attr-name"
                  placeholder={`Nhập tên ${attributeTypes.find(type => type.id === activeTab)?.name}`}
                  value={newAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name]}
                  onChange={(e) => setNewAttribute((prev: Record<string, string>) => ({ 
                    ...prev, 
                    [attributeFieldMappings[activeTab as AttributeFieldKey].name]: e.target.value 
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="attr-desc">Mô tả</Label>
                <Input
                  id="attr-desc"
                  placeholder="Nhập mô tả"
                  value={newAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].description]}
                  onChange={(e) => setNewAttribute((prev: Record<string, string>) => ({ 
                    ...prev, 
                    [attributeFieldMappings[activeTab as AttributeFieldKey].description]: e.target.value 
                  }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleAddAttribute} disabled={!newAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name]}>Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog chỉnh sửa thuộc tính */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Pencil className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Chỉnh sửa {attributeTypes.find(type => type.id === activeTab)?.name}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500">
                    Cập nhật thông tin {attributeTypes.find(type => type.id === activeTab)?.name.toLowerCase()}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {editingAttribute && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-attr-name" className="text-sm font-medium text-slate-700">
                      Tên {attributeTypes.find(type => type.id === activeTab)?.name} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-attr-name"
                      placeholder={`Nhập tên ${attributeTypes.find(type => type.id === activeTab)?.name}`}
                      value={editingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name]}
                      onChange={(e) => setEditingAttribute((prev: Record<string, any> | null) => prev ? { 
                        ...prev, 
                        [attributeFieldMappings[activeTab as AttributeFieldKey].name]: e.target.value 
                      } : null)}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-attr-code" className="text-sm font-medium text-slate-700">Mã</Label>
                    <Input
                      id="edit-attr-code"
                      value={editingAttribute.ma_chat_lieu || editingAttribute.ma_thuong_hieu || 
                             editingAttribute.ma_kieu_dang || editingAttribute.ma_xuat_xu || 
                             editingAttribute.ma_mau_sac || editingAttribute.ma_kich_co}
                      disabled
                      className="bg-slate-50 border-slate-200 text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-attr-desc" className="text-sm font-medium text-slate-700">Mô tả</Label>
                  <Input
                    id="edit-attr-desc"
                    placeholder="Nhập mô tả"
                    value={editingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].description]}
                    onChange={(e) => setEditingAttribute((prev: Record<string, any> | null) => prev ? { 
                      ...prev, 
                      [attributeFieldMappings[activeTab as AttributeFieldKey].description]: e.target.value 
                    } : null)}
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Trạng thái</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        editingAttribute.trang_thai === "HoatDong" 
                          ? "border-blue-500 bg-blue-50 shadow-sm" 
                          : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                      }`}
                      onClick={() => setEditingAttribute((prev: Record<string, any> | null) => prev ? { ...prev, trang_thai: "HoatDong" } : null)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${
                        editingAttribute.trang_thai === "HoatDong" 
                          ? "border-blue-500 bg-blue-500" 
                          : "border-slate-300"
                      }`}>
                        {editingAttribute.trang_thai === "HoatDong" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-700 mb-0.5">Hoạt động</div>
                        <div className="text-sm text-slate-500">Thuộc tính có thể được sử dụng</div>
                      </div>
                    </div>
                    <div 
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        editingAttribute.trang_thai === "KhongHoatDong" 
                          ? "border-red-500 bg-red-50 shadow-sm" 
                          : "border-slate-200 hover:border-red-200 hover:bg-slate-50"
                      }`}
                      onClick={() => setEditingAttribute((prev: Record<string, any> | null) => prev ? { ...prev, trang_thai: "KhongHoatDong" } : null)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${
                        editingAttribute.trang_thai === "KhongHoatDong" 
                          ? "border-red-500 bg-red-500" 
                          : "border-slate-300"
                      }`}>
                        {editingAttribute.trang_thai === "KhongHoatDong" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-700 mb-0.5">Không hoạt động</div>
                        <div className="text-sm text-slate-500">Thuộc tính tạm thời bị vô hiệu hóa</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-slate-200 hover:bg-slate-100"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleEditAttribute} 
                disabled={!editingAttribute?.[attributeFieldMappings[activeTab as AttributeFieldKey].name]}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog xem chi tiết thuộc tính */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <span>Chi tiết {attributeTypes.find(type => type.id === activeTab)?.name}</span>
                <span className="text-sm font-normal text-slate-500">
                  (ID: {viewingAttribute?.[attributeFieldMappings[activeTab as AttributeFieldKey].id]})
                </span>
              </DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về thuộc tính sản phẩm
              </DialogDescription>
            </DialogHeader>
            {viewingAttribute && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Tên {attributeTypes.find(type => type.id === activeTab)?.name}</Label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm font-medium">
                      {viewingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name]}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Mã</Label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm font-medium">
                      {viewingAttribute.ma_chat_lieu || viewingAttribute.ma_thuong_hieu || viewingAttribute.ma_kieu_dang || 
                       viewingAttribute.ma_xuat_xu || viewingAttribute.ma_mau_sac || viewingAttribute.ma_kich_co || viewingAttribute.ma_danh_muc}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-500">Mô tả</Label>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm min-h-[100px] whitespace-pre-wrap">
                    {viewingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].description] || 'Không có mô tả'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-500">Trạng thái</Label>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      viewingAttribute.trang_thai === "HoatDong" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {viewingAttribute.trang_thai === "HoatDong" ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-4">Thông tin hệ thống</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Người tạo</Label>
                      <div className="p-3 bg-slate-50 rounded-lg text-sm">
                        {viewingAttribute.id_nguoi_tao || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Ngày tạo</Label>
                      <div className="p-3 bg-slate-50 rounded-lg text-sm">
                        {viewingAttribute.ngay_tao || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Người sửa</Label>
                      <div className="p-3 bg-slate-50 rounded-lg text-sm">
                        {viewingAttribute.id_nguoi_sua || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Ngày sửa</Label>
                      <div className="p-3 bg-slate-50 rounded-lg text-sm">
                        {viewingAttribute.ngay_sua || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Thêm Dialog xóa */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Xác nhận xóa
              </DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa thuộc tính này? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            {deletingAttribute && (
              <div className="py-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="font-medium text-red-800">
                    {deletingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].name]}
                  </div>
                  <div className="text-sm text-red-600 mt-1">
                    Mã: {deletingAttribute.ma_chat_lieu || deletingAttribute.ma_thuong_hieu || 
                          deletingAttribute.ma_kieu_dang || deletingAttribute.ma_xuat_xu || 
                          deletingAttribute.ma_mau_sac || deletingAttribute.ma_kich_co || deletingAttribute.ma_danh_muc}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingAttribute(null);
                }}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteAttribute(deletingAttribute[attributeFieldMappings[activeTab as AttributeFieldKey].id])}
              >
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
