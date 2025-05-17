import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

export function getAvatarByRole(role: string) {
  switch (role) {
    case 'Admin':
      return '/images/avatars/admin-avatar.png';
    case 'NhanVien':
      return '/images/avatars/staff-avatar.png';
    default:
      return '/images/avatars/default-avatar.png';
  }
}
