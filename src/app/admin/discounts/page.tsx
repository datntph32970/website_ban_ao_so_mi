"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { giamGiaService } from "@/services/giam-gia.service";
import { GiamGia } from "@/types/giam-gia";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { DiscountHeader } from "@/components/discounts/DiscountHeader";
import { DiscountFilters } from "@/components/discounts/DiscountFilters";
import { CreateDiscountDialog } from "@/components/discounts/CreateDiscountDialog";
import debounce from 'lodash/debounce';

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterConfig, setFilterConfig] = useState({
    status: 'all',
    discountType: 'all',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 10,
    sortBy: '' as string,
    ascending: true
  });

  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<GiamGia | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Tạo hàm debounce để cập nhật searchTerm
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 500),
    []
  );

  // Effect để xử lý debounce search
  useEffect(() => {
    debouncedSetSearch(searchTerm);
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchTerm, debouncedSetSearch]);

  // Query để lấy danh sách giảm giá
  const {
    data: discounts = { data: [], totalItems: 0, currentPage: 1, pageSize: 10, totalPages: 1 },
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['discounts', filterConfig, debouncedSearchTerm],
    queryFn: async () => {
      const params: any = {};

      if (filterConfig.status !== 'all') {
        params.trang_thai = filterConfig.status;
      }

      if (filterConfig.discountType !== 'all') {
        params.kieu_giam_gia = filterConfig.discountType;
      }

      if (debouncedSearchTerm) {
        params.tim_kiem = debouncedSearchTerm;
      }

      if (filterConfig.startDate) {
        params.thoi_gian_bat_dau = filterConfig.startDate;
      }

      if (filterConfig.endDate) {
        params.thoi_gian_ket_thuc = filterConfig.endDate;
      }

      // Add sorting params
      if (filterConfig.sortBy) {
        params.sortBy = filterConfig.sortBy;
        params.ascending = filterConfig.ascending;
      }

      params.page = filterConfig.page;
      params.pageSize = filterConfig.pageSize;

      return giamGiaService.getAll(params);
    },
    staleTime: 30 * 1000,
  });

  // Mutation để xóa nhiều giảm giá
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => giamGiaService.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Xóa giảm giá thành công!');
      setSelectedDiscounts([]);
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (error: unknown) => {
      console.error('Lỗi khi xóa giảm giá:', error);
      toast.error('Có lỗi xảy ra khi xóa giảm giá!');
    }
  });

  // Effect cho filter changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['discounts'] });
  }, [filterConfig, queryClient]);

  const handleBulkDelete = async () => {
    bulkDeleteMutation.mutate(selectedDiscounts);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDiscounts(discounts.data.map(d => String(d.id_giam_gia)));
    } else {
      setSelectedDiscounts([]);
    }
  };

  const handleSelectDiscount = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDiscounts(prev => [...prev, id]);
    } else {
      setSelectedDiscounts(prev => prev.filter(d => d !== id));
    }
  };

  const handleEdit = (discount: GiamGia) => {
    setSelectedDiscount(discount);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await giamGiaService.delete(id);
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Xóa giảm giá thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa giảm giá:', error);
      toast.error('Có lỗi xảy ra khi xóa giảm giá!');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 mb-6">
        <DiscountHeader
          selectedCount={selectedDiscounts.length}
          onBulkDelete={() => setIsBulkDeleteDialogOpen(true)}
          onAddNew={() => setIsCreateDialogOpen(true)}
        />
        <DiscountFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterConfig={filterConfig}
          onFilterChange={setFilterConfig}
          discounts={discounts.data}
          totalItems={discounts.totalItems}
          selectedDiscounts={selectedDiscounts}
          onSelectAll={handleSelectAll}
          onSelectDiscount={handleSelectDiscount}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
          isFetching={isFetching}
        />
      </div>

      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa giảm giá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedDiscounts.length} giảm giá đã chọn? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Xóa giảm giá</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateDiscountDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </AdminLayout>
  );
} 