'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { giamGiaService } from '@/services/giam-gia.service';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SanPham } from '@/types/san-pham';

interface ManageProductsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    discountId: string;
}

export function ManageProductsDialog({
    open,
    onOpenChange,
    discountId,
}: ManageProductsDialogProps) {
    const [products, setProducts] = useState<SanPham[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProducts = async () => {
        try {
            const response = await giamGiaService.getSanPhamCoTheGiamGia({
                timkiem: searchTerm,
            });
            setProducts(response.danh_sach);
        } catch (error) {
            toast.error('Không thể tải danh sách sản phẩm');
        }
    };

    useEffect(() => {
        if (open) {
            fetchProducts();
        }
    }, [open, searchTerm]);

    const handleSave = async () => {
        try {
            await giamGiaService.themGiamGiaVaoSanPhamChiTiet({
                id_giam_gia: discountId,
                san_pham_chi_tiet_ids: selectedProducts,
            });
            toast.success('Cập nhật sản phẩm thành công');
            onOpenChange(false);
        } catch (error) {
            toast.error('Không thể cập nhật sản phẩm');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Quản lý sản phẩm giảm giá</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {products.map((product) => (
                                <div
                                    key={product.id_san_pham}
                                    className="flex items-center space-x-2 p-2 border rounded"
                                >
                                    <Checkbox
                                        id={product.id_san_pham}
                                        checked={selectedProducts.includes(product.id_san_pham)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedProducts([...selectedProducts, product.id_san_pham]);
                                            } else {
                                                setSelectedProducts(
                                                    selectedProducts.filter((id) => id !== product.id_san_pham)
                                                );
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor={product.id_san_pham}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {product.ten_san_pham}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSave}>Lưu</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 