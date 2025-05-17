"use client";

export function LoadingOverlay() {
  return (
    <div
      id="global-loading-overlay"
      className="fixed inset-0 bg-black/50 items-center justify-center z-50 hidden"
    >
      <div className="bg-white rounded-lg p-4 flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="text-sm font-medium">Đang tải...</span>
      </div>
    </div>
  );
} 