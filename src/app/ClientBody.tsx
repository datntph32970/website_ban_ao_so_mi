"use client";

import React, { useEffect, useState } from "react";

export function ClientBody({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Chỉ thực hiện một lần sau khi component đã được gắn kết ở phía client
    setMounted(true);

    // Xóa các thuộc tính có thể gây lỗi hydration
    // Các thuộc tính này được thêm bởi extension hoặc scripts bên thứ ba
    const removeAttributes = () => {
      const body = document.querySelector('body');
      if (body) {
        body.removeAttribute('data-new-gr-c-s-check-loaded');
        body.removeAttribute('data-gr-ext-installed');
        // Xóa các thuộc tính khác có thể gây lỗi
      }
    };

    removeAttributes();

    // Chỉ cần set timeout ngắn để đảm bảo DOM đã được cập nhật
    setTimeout(removeAttributes, 0);
  }, []);

  if (!mounted) {
    // Khi ở server-side hoặc chưa mounted, trả về placeholder
    return <div suppressHydrationWarning className="opacity-0">{children}</div>;
  }

  // Sau khi mounted ở client, render bình thường với suppressHydrationWarning
  return <div suppressHydrationWarning>{children}</div>;
}
