"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductDetailRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new product page with "new" as the ID
    router.replace("/admin/products/new");
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Redirecting to new product form...</p>
    </div>
  );
}
