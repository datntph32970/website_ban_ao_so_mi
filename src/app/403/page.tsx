import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <ShieldAlert className="h-16 w-16 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Truy cập bị từ chối</h1>
            <p className="text-slate-500">
              Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cần được cấp quyền.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/">
                Về trang chủ
              </Link>
            </Button>
            <Button asChild>
              <Link href="/auth/login">
                Đăng nhập
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 