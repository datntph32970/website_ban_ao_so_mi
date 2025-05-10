import * as React from "react";
import { Check } from "lucide-react";

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  values,
  onChange,
  placeholder = "Chọn...",
  className = "",
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filtered = options.filter(
    (opt) => opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[40px]"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={values.length === 0 ? "text-slate-400" : ""}>
          {values.length === 0
            ? placeholder
            : `Đã chọn ${values.length} mục`}
        </span>
        <svg className={`ml-2 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-2xl max-h-60 overflow-auto animate-fade-in">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-3 py-2">
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2 select-none">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Không có kết quả</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(opt => {
                const selected = values.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className={`flex items-center px-3 py-2 cursor-pointer transition-colors gap-2 group rounded-md text-sm font-normal
                      ${selected ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-accent hover:text-accent-foreground'}
                    `}
                    onClick={() => handleToggle(opt.value)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleToggle(opt.value); }}
                  >
                    <span className="truncate">{opt.label}</span>
                    <span className="flex-1" />
                    {selected && <Check className="h-5 w-5 text-blue-500 opacity-100 transition-opacity" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Hiệu ứng và scrollbar đẹp */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.18s cubic-bezier(.4,0,.2,1);
        }
        .max-h-60::-webkit-scrollbar {
          width: 8px;
          background: #f1f5f9;
          border-radius: 8px;
        }
        .max-h-60::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};
