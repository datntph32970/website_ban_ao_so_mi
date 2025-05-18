import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";

interface DiscountHeaderProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onAddNew: () => void;
}

export function DiscountHeader({ selectedCount, onBulkDelete, onAddNew }: DiscountHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold mb-2">Quản lý khuyến mại cho sản phẩm</h1>
        <p className="text-slate-500">Quản lý các chương trình khuyến mại cho sản phẩm</p>
      </div>
      <div className="flex gap-2">
        {selectedCount > 0 && (
          <Button 
            variant="destructive" 
            className="gap-2"
            onClick={onBulkDelete}
          >
            <Trash className="h-4 w-4" />
            <span>Xóa ({selectedCount})</span>
          </Button>
        )}
        <Button className="gap-2" onClick={onAddNew}>
          <Plus className="h-4 w-4" />
          <span>Thêm khuyến mại</span>
        </Button>
      </div>
    </div>
  );
} 