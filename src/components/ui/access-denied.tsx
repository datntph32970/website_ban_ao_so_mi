import { AlertCircle } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Truy cập bị từ chối</h2>
      <p className="text-gray-500 text-center">
        Bạn không có quyền truy cập vào trang này.
      </p>
    </div>
  );
} 