import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import { GiamGia, TrangThaiGiamGia } from "@/types/giam-gia";
import { DiscountTable } from "./DiscountTable";

interface FilterConfig {
  status: string;
  discountType: string;
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  sortBy: string;
  ascending: boolean;
}

interface DiscountFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  discounts: GiamGia[];
  totalItems: number;
  selectedDiscounts: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectDiscount: (id: string, checked: boolean) => void;
  onEdit: (discount: GiamGia) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  isFetching: boolean;
}

export function DiscountFilters({
  searchTerm,
  onSearchChange,
  filterConfig,
  onFilterChange,
  discounts,
  totalItems,
  selectedDiscounts,
  onSelectAll,
  onSelectDiscount,
  onEdit,
  onDelete,
  isLoading,
  isFetching,
}: DiscountFiltersProps) {
  const handleFilterChange = (key: keyof FilterConfig, value: string | number | boolean) => {
    onFilterChange({
      ...filterConfig,
      [key]: value,
      page: 1
    });
  };

  const handleSort = (column: string) => {
    onFilterChange({
      ...filterConfig,
      sortBy: column,
      ascending: filterConfig.sortBy === column ? !filterConfig.ascending : true,
      page: 1
    });
  };

  const handleClearSearch = () => {
    onSearchChange("");
  };

  const totalPages = Math.ceil(totalItems / filterConfig.pageSize);

  const handlePreviousPage = () => {
    if (filterConfig.page > 1) {
      onFilterChange({
        ...filterConfig,
        page: filterConfig.page - 1
      });
    }
  };

  const handleNextPage = () => {
    if (filterConfig.page < totalPages) {
      onFilterChange({
        ...filterConfig,
        page: filterConfig.page + 1
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Search Box - Takes 5 columns */}
            <div className="lg:col-span-5 space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  className="pl-10 pr-10"
                  placeholder="Tìm theo tên, mã..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    title="Xóa tìm kiếm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select
                value={filterConfig.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value={TrangThaiGiamGia.HoatDong}>Đang hoạt động</SelectItem>
                  <SelectItem value={TrangThaiGiamGia.NgungHoatDong}>Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Type Filter - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-2">
              <label className="text-sm font-medium">Loại giảm giá</label>
              <Select
                value={filterConfig.discountType}
                onValueChange={(value) => handleFilterChange('discountType', value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Chọn loại giảm giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PhanTram">Phần trăm</SelectItem>
                  <SelectItem value="SoTien">Số tiền cố định</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range - Takes 3 columns */}
            <div className="lg:col-span-3 space-y-2">
              <label className="text-sm font-medium">Thời gian</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filterConfig.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full"
                />
                <Input
                  type="date"
                  value={filterConfig.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DiscountTable
        discounts={discounts}
        selectedDiscounts={selectedDiscounts}
        onSelectAll={onSelectAll}
        onSelectDiscount={onSelectDiscount}
        onEdit={onEdit}
        onDelete={onDelete}
        onSort={handleSort}
        sortBy={filterConfig.sortBy || ''}
        ascending={filterConfig.ascending || false}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Hiển thị {discounts.length} / {totalItems} kết quả
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Hiển thị</span>
            <Select
              value={String(filterConfig.pageSize)}
              onValueChange={(value) => handleFilterChange('pageSize', Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">dòng</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={filterConfig.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Trang {filterConfig.page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={filterConfig.page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 