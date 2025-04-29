"use client";

import { useState, useEffect } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Plus, Search, Trash, Filter, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { SanPham } from "@/types/san-pham";
import { SanPhamChiTiet } from "@/types/san-pham-chi-tiet";
import { GiamGia } from "@/types/giam-gia";
import { sanPhamService } from "@/services/san-pham.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { mapSanPhamList } from '@/utils/san-pham.utils';

// Thêm các chương trình khuyến mãi mẫu
const mockPromotions = [
  { id: "1", name: "Khuyến mãi mùa hè", code: "SUMMER2024", discount: 150000, startDate: "2024-06-01", endDate: "2024-08-31", status: "active" },
  { id: "2", name: "Khuyến mãi mùa đông", code: "WINTER2024", discount: 200000, startDate: "2024-11-01", endDate: "2025-01-31", status: "active" },
  { id: "3", name: "Khuyến mãi Black Friday", code: "BF2024", discount: 300000, startDate: "2024-11-25", endDate: "2024-11-30", status: "pending" },
  { id: "4", name: "Khuyến mãi sinh nhật", code: "BDAY2024", discount: 250000, startDate: "2024-04-15", endDate: "2024-04-30", status: "active" },
  { id: "5", name: "Khuyến mãi Tết", code: "TET2025", discount: 350000, startDate: "2025-01-15", endDate: "2025-02-15", status: "pending" },
];

// Hàm lấy thông tin giảm giá từ ID chương trình khuyến mãi
const getPromotionDiscount = (promotionId: string): number => {
  if (!promotionId || promotionId === "_none") return 0;
  const promotion = mockPromotions.find(p => p.id === promotionId);
  return promotion?.status === 'active' ? (promotion?.discount || 0) : 0;
};

// Danh sách thương hiệu
const brands = [
  { id: 1, name: "Nike" },
  { id: 2, name: "Adidas" },
  { id: 3, name: "Vans" },
  { id: 4, name: "Converse" },
  { id: 5, name: "New Balance" },
];

// Danh sách danh mục
const categories = [
  { id: 1, name: "Giày thể thao" },
  { id: 2, name: "Giày chạy bộ" },
  { id: 3, name: "Giày thời trang" },
  { id: 4, name: "Giày đá bóng" },
];

// Định nghĩa type cho item hiển thị danh sách sản phẩm
type ProductListItem = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  stock: number;
  sold: number;
  imageUrl: string;
  created_at: string;
  updated_at: string;
  promotionId?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Thêm state cho bộ lọc
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showDiscounted, setShowDiscounted] = useState(false);
  const [searchType, setSearchType] = useState<"name" | "code" | "all">("all");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await sanPhamService.getDanhSachSanPham();
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const mapped = mapSanPhamList(data, API_BASE);
        setProducts(mapped);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      }
    };
    fetchProducts();
  }, []);

  // Lọc sản phẩm theo từ khóa tìm kiếm và bộ lọc
  const filteredProducts = products.filter(product => {
    // Tìm kiếm theo tên hoặc mã sản phẩm dựa vào loại tìm kiếm
    let matchesSearch = true;
    if (searchTerm.trim() !== "") {
      if (searchType === "name") {
        matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchType === "code") {
        matchesSearch = product.code.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        // Tìm kiếm cả tên và mã
        matchesSearch =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase());
      }
    }

    // Lọc theo giá
    const matchesPrice =
      product.price >= priceRange[0] &&
      product.price <= priceRange[1];

    // Lọc theo thương hiệu
    const matchesBrand =
      selectedBrands.length === 0 ||
      selectedBrands.includes(product.brand);

    // Lọc theo danh mục
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);

    // Lọc theo khuyến mãi
    const matchesDiscount =
      !showDiscounted ||
      product.promotionId !== undefined;

    return matchesSearch && matchesPrice && matchesBrand && matchesCategory && matchesDiscount;
  });

  // Sắp xếp sản phẩm
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortBy) return 0;

    if (sortBy === "name") {
      return sortDirection === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }

    if (sortBy === "price") {
      return sortDirection === "asc"
        ? a.price - b.price
        : b.price - a.price;
    }

    if (sortBy === "stock") {
      return sortDirection === "asc"
        ? a.stock - b.stock
        : b.stock - a.stock;
    }

    if (sortBy === "code") {
      return sortDirection === "asc"
        ? a.code.localeCompare(b.code)
        : b.code.localeCompare(a.code);
    }

    return 0;
  });

  // Reset bộ lọc
  const resetFilters = () => {
    setPriceRange([0, 5000000]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setShowDiscounted(false);
    setSearchType("all");
  };

  // Xử lý sắp xếp
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Xử lý xóa sản phẩm
  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setProducts(products.filter(product => String(product.id) !== String(productToDelete)));
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Format giá tiền
  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(Number(value));

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý sản phẩm</h1>
            <p className="text-slate-500">Quản lý danh sách sản phẩm giày của cửa hàng</p>
          </div>
          <Link href="/products/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Thêm sản phẩm</span>
            </Button>
          </Link>
        </div>

        <div className="mb-6 flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              className="pl-10"
              placeholder={`Tìm kiếm theo ${searchType === "name" ? "tên" : searchType === "code" ? "mã" : "tên, mã"} sản phẩm...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-4 w-4" />
            <span>Lọc</span>
          </Button>
        </div>

        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Bộ lọc sản phẩm</DialogTitle>
              <DialogDescription>
                Tính năng đang được phát triển
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFilterOpen(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="rounded-lg border shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[50px]">STT</TableHead>
                <TableHead className="w-[80px]">Ảnh</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("code")}
                >
                  <div className="flex items-center">
                    Mã sản phẩm
                    {sortBy === "code" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Tên sản phẩm
                    {sortBy === "name" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Thương hiệu</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center justify-end">
                    Giá (₫)
                    {sortBy === "price" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("stock")}
                >
                  <div className="flex items-center justify-center">
                    Tồn kho
                    {sortBy === "stock" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Đã bán</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-slate-500">
                    Không tìm thấy sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product, idx) => (
                  <TableRow key={String(product.id)} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-14 w-14 object-cover rounded-md" />
                      ) : (
                        <div className="h-14 w-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                          {product.code.split('-')[0]}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/products/${String(product.id)}`}
                        className="hover:text-blue-600 hover:underline transition-colors"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs">
                        {product.brand}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div>
                        {product.promotionId ? (
                          <>
                            <div className="text-green-600">
                              {product.minPrice === product.maxPrice ? (
                                formatCurrency(product.minPrice - getPromotionDiscount(product.promotionId))
                              ) : (
                                `${formatCurrency(product.minPrice - getPromotionDiscount(product.promotionId))} - ${formatCurrency(product.maxPrice - getPromotionDiscount(product.promotionId))}`
                              )}
                            </div>
                            <div className="text-xs text-slate-400 line-through">
                              {product.minPrice === product.maxPrice ? (
                                formatCurrency(product.minPrice)
                              ) : (
                                `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`
                              )}
                            </div>
                            <div className="text-xs text-blue-500">
                              {mockPromotions.find(p => p.id === product.promotionId)?.name || ""}
                            </div>
                          </>
                        ) : (
                          product.minPrice === product.maxPrice ? (
                            formatCurrency(product.minPrice)
                          ) : (
                            `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.stock > 30 ? "bg-green-100 text-green-800" :
                        product.stock > 10 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-slate-600">{product.sold}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="icon" variant="ghost" className="text-blue-500 hover:bg-blue-50">
                          <Link href={`/products/${String(product.id)}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(String(product.id))}>
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

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-500">
            Hiển thị {sortedProducts.length} trên tổng số {products.length} sản phẩm
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Trước</Button>
            <Button variant="outline" size="sm" className="bg-slate-100">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Sau</Button>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={confirmDelete}>Xóa sản phẩm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
