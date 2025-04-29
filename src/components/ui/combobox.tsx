import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export interface ComboboxProps<T> {
  items: T[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  className?: string;
}

function Combobox<T>({
  items,
  value,
  onValueChange,
  placeholder = "Chọn...",
  getLabel,
  getValue,
  className = "",
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const filtered = items.filter(item =>
    (getLabel(item) || '').toLowerCase().includes(search.toLowerCase())
  );
  const selected = items.find(item => getValue(item) === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200",
            className
          )}
        >
          <span>{selected ? getLabel(selected) : <span className="text-slate-400">{placeholder}</span>}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 text-slate-400" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content align="start" className="w-[--radix-popover-trigger-width] p-2 bg-white rounded-xl border border-slate-200 shadow-md mt-2">
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 mb-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-slate-400 px-3 py-2">Không có kết quả</div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={getValue(item) || idx}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-base",
                value === getValue(item) && "bg-blue-50 text-blue-700"
              )}
              onClick={() => {
                onValueChange(getValue(item));
                setOpen(false);
                setSearch("");
              }}
            >
              <Check className={cn("h-4 w-4", value === getValue(item) ? "opacity-100" : "opacity-0")}/>
              {getLabel(item)}
            </button>
          ))}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}

export default Combobox; 