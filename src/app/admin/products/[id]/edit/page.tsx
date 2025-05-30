"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import ProductGeneralInfoForm from "@/components/product/ProductGeneralInfoForm";
import ColorTabs from "@/components/product/ColorTabs";
import { SanPham } from "@/types/san-pham";
import { sanPhamService, UpdateSanPhamDTO } from "@/services/san-pham.service";
import { attributeService } from "@/services/attribute.service";
import { giamGiaService } from "@/services/giam-gia.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ThuongHieu } from "@/types/thuong-hieu";
import { KieuDang } from "@/types/kieu-dang";
import { ChatLieu } from "@/types/chat-lieu";
import { XuatXu } from "@/types/xuat-xu";
import { DanhMuc } from "@/types/danh-muc";
import { MauSac } from "@/types/mau-sac";
import { KichCo } from "@/types/kich-co";
import { GiamGia } from "@/types/giam-gia";
import { SanPhamChiTiet,SuaSanPhamChiTietAdminDTO, ThemHinhAnhSanPhamChiTietAdminDTO } from "@/types/san-pham-chi-tiet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  ten_san_pham: z.string().min(1, "Tên sản phẩm là bắt buộc").max(100, "Tên sản phẩm không được vượt quá 100 ký tự"),
  mo_ta: z.string().min(1, "Mô tả là bắt buộc").max(1000, "Mô tả không được vượt quá 1000 ký tự"),
  id_thuong_hieu: z.string().min(1, "Thương hiệu là bắt buộc"),
  id_kieu_dang: z.string().min(1, "Kiểu dáng là bắt buộc"),
  id_chat_lieu: z.string().min(1, "Chất liệu là bắt buộc"),
  id_xuat_xu: z.string().min(1, "Xuất xứ là bắt buộc"),
  id_danh_muc: z.string().min(1, "Danh mục là bắt buộc"),
  url_anh_mac_dinh: z.string(),
  trang_thai: z.enum(["HoatDong", "KhongHoatDong"]),
});

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.id;
  const [product, setProduct] = useState<SanPham | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [defaultProductImage, setDefaultProductImage] = useState<File | null>(null);
  const [defaultProductImageUrl, setDefaultProductImageUrl] = useState<string>("");
  const [brands, setBrands] = useState<ThuongHieu[]>([]);
  const [styles, setStyles] = useState<KieuDang[]>([]);
  const [materials, setMaterials] = useState<ChatLieu[]>([]);
  const [origins, setOrigins] = useState<XuatXu[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [colors, setColors] = useState<MauSac[]>([]);
  const [sizes, setSizes] = useState<KichCo[]>([]);
  const [discounts, setDiscounts] = useState<GiamGia[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedColorTab, setSelectedColorTab] = useState<string>("");
  const [addColorOpen, setAddColorOpen] = useState(false);
  const [selectedSizesByColor, setSelectedSizesByColor] = useState<Record<string, string[]>>({});
  const [variantImages, setVariantImages] = useState<Record<string, (File | string)[]>>({});
  const [variantValues, setVariantValues] = useState<Record<string, Record<string, { stock: number; importPrice: number; price: number; discount: string[]; images: (File | string)[] }>>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const tenSanPhamRef = React.useRef<HTMLInputElement>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteColorDialogOpen, setIsDeleteColorDialogOpen] = useState(false);
  const [isDeleteSizeDialogOpen, setIsDeleteSizeDialogOpen] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<string>("");
  const [sizeToDelete, setSizeToDelete] = useState<{colorId: string, sizeId: string} | null>(null);
  const [isQuickAddColorOpen, setIsQuickAddColorOpen] = useState(false);
  const [isQuickAddSizeOpen, setIsQuickAddSizeOpen] = useState(false);
  const [newQuickColor, setNewQuickColor] = useState({ ten_mau_sac: "", mo_ta: "" });
  const [newQuickSize, setNewQuickSize] = useState({ ten_kich_co: "", mo_ta: "" });
  const [selectedDiscount, setSelectedDiscount] = useState<string>("");
  const [attrLoading, setAttrLoading] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ten_san_pham: "",
      mo_ta: "",
      id_thuong_hieu: "",
      id_kieu_dang: "",
      id_chat_lieu: "",
      id_xuat_xu: "",
      id_danh_muc: "",
      url_anh_mac_dinh: "",
      trang_thai: "HoatDong",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        toast.error("Không tìm thấy ID sản phẩm");
        router.push("/admin/products");
        return;
      }

      try {
        setIsLoading(true);
        const [
          productData,
          allBrands,
          allStyles,
          allMaterials,
          allOrigins,
          allCategories,
          colorsData,
          sizesData,
          discountsData,
        ] = await Promise.all([
          sanPhamService.getChiTietSanPham(productId),
          attributeService.getAttributes('ThuongHieu'),
          attributeService.getAttributes('KieuDang'),
          attributeService.getAttributes('ChatLieu'),
          attributeService.getAttributes('XuatXu'),
          attributeService.getAttributes('DanhMuc'),
          attributeService.getAttributes('MauSac'),
          attributeService.getAttributes('KichCo'),
          giamGiaService.getAll({
            trang_hien_tai: 1,
            so_phan_tu_tren_trang: 10
          }),
        ]);

        if (!productData) {
          toast.error("Không tìm thấy thông tin sản phẩm");
          router.push("/admin/products");
          return;
        }

        setProduct(productData);

        // Set attributes for dropdowns, keeping inactive ones that are used in the product
        setBrands((allBrands as ThuongHieu[]).filter(b => 
          b.trang_thai === 'HoatDong' || String(b.id_thuong_hieu) === String(productData.thuongHieu?.id_thuong_hieu)
        ));
        setStyles((allStyles as KieuDang[]).filter(s => 
          s.trang_thai === 'HoatDong' || String(s.id_kieu_dang) === String(productData.kieuDang?.id_kieu_dang)
        ));
        setMaterials((allMaterials as ChatLieu[]).filter(m => 
          m.trang_thai === 'HoatDong' || String(m.id_chat_lieu) === String(productData.chatLieu?.id_chat_lieu)
        ));
        setOrigins((allOrigins as XuatXu[]).filter(o => 
          o.trang_thai === 'HoatDong' || String(o.id_xuat_xu) === String(productData.xuatXu?.id_xuat_xu)
        ));
        setCategories((allCategories as DanhMuc[]).filter(c => 
          c.trang_thai === 'HoatDong' || String(c.id_danh_muc) === String(productData.danhMuc?.id_danh_muc)
        ));
        setColors((colorsData as MauSac[]).filter(c => c.trang_thai === 'HoatDong'));
        setSizes((sizesData as KichCo[]).filter(s => s.trang_thai === 'HoatDong'));
        setDiscounts(discountsData.data as GiamGia[]);

        // Set form values with full attribute data
        form.reset({
          ten_san_pham: productData.ten_san_pham,
          mo_ta: productData.mo_ta,
          id_thuong_hieu: String(productData.thuongHieu?.id_thuong_hieu),
          id_kieu_dang: String(productData.kieuDang?.id_kieu_dang),
          id_chat_lieu: String(productData.chatLieu?.id_chat_lieu),
          id_xuat_xu: String(productData.xuatXu?.id_xuat_xu),
          id_danh_muc: String(productData.danhMuc?.id_danh_muc),
          url_anh_mac_dinh: productData.url_anh_mac_dinh,
          trang_thai: productData.trang_thai as "HoatDong" | "KhongHoatDong",
        });
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        // Convert default image URL to File object
        if (productData.url_anh_mac_dinh) {
          try {
            const imageUrl = productData.url_anh_mac_dinh.startsWith('http') 
              ? productData.url_anh_mac_dinh 
              : `${API_BASE}${productData.url_anh_mac_dinh}`;
            
            setDefaultProductImageUrl(imageUrl);
            setPreviewImages([imageUrl]);
            form.setValue('url_anh_mac_dinh', imageUrl);
          } catch (error) {
            console.error("Error loading default image:", error);
            toast.error("Không thể tải ảnh mặc định của sản phẩm");
          }
        }

        // Set variant data
        if (productData.sanPhamChiTiets?.length) {
          console.log('Processing variants:', productData.sanPhamChiTiets.length);
          const colorIds = [...new Set(productData.sanPhamChiTiets.map((v: SanPhamChiTiet) => String(v.mauSac?.id_mau_sac)))] as string[];
          console.log('Color IDs:', colorIds);
          setSelectedColors(colorIds);
          setSelectedColorTab(colorIds[0] || "");

          const sizesByColor: Record<string, string[]> = {};
          const imagesByColor: Record<string, (File | string)[]> = {};
          const valuesByColor: Record<string, Record<string, { stock: number; importPrice: number; price: number; discount: string[]; images: (File | string)[] }>> = {};

          // Process variants
          for (const variant of productData.sanPhamChiTiets) {
            const colorId = String(variant.mauSac?.id_mau_sac);
            const sizeId = String(variant.kichCo?.id_kich_co);
            console.log('Processing variant:', { colorId, sizeId });

            if (!sizesByColor[colorId]) {
              sizesByColor[colorId] = [];
            }
            sizesByColor[colorId].push(sizeId);

            if (!valuesByColor[colorId]) {
              valuesByColor[colorId] = {};
            }
            valuesByColor[colorId][sizeId] = {
              stock: variant.so_luong,
              importPrice: variant.gia_nhap,
              price: variant.gia_ban,
              discount: Array.isArray(variant.giamGias) ? variant.giamGias.map(g => g.id_giam_gia) : [],
              images: [],
            };

            if (variant.hinhAnhSanPhamChiTiets?.length) {
              console.log('Variant images count:', variant.hinhAnhSanPhamChiTiets.length);
              try {
                const imageUrls = variant.hinhAnhSanPhamChiTiets.map((img: { hinh_anh_urls: string }) => {
                  const imageUrl = img.hinh_anh_urls.startsWith('http')
                    ? img.hinh_anh_urls
                    : `${API_BASE}${img.hinh_anh_urls}`;
                  return imageUrl;
                });
                imagesByColor[colorId] = imageUrls;
              } catch (error: any) {
                console.error("Error loading variant images:", error);
                toast.error(`Không thể tải ảnh cho biến thể ${colorId}: ${error.message}`);
              }
            }
          }

          console.log('Setting state with processed data');
          setSelectedSizesByColor(sizesByColor);
          setVariantImages(imagesByColor);
          setVariantValues(valuesByColor);
        }
      } catch (error) {
        console.error("Error loading product data:", error);
        toast.error("Có lỗi xảy ra khi tải thông tin sản phẩm");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, router, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

      // Validate default image
      if (!defaultProductImage && !defaultProductImageUrl) {
        toast.error("Vui lòng chọn ảnh mặc định cho sản phẩm");
        setIsSaving(false);
        return;
      }

      // Convert variant data to DTO format
      const sanPhamChiTiets: SuaSanPhamChiTietAdminDTO[] = [];
      
      // Helper function to convert File to base64
      const fileToBase64 = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };

      // Helper function to fetch image as base64
      const fetchImageAsBase64 = async (url: string): Promise<string> => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error fetching image:", error);
          throw error;
        }
      };

      // Convert default image to base64 if it's a File
      let defaultImageUrl = "";
      if (defaultProductImage instanceof File) {
        try {
          defaultImageUrl = await fileToBase64(defaultProductImage);
        } catch (error) {
          console.error("Error converting default image to base64:", error);
          toast.error("Không thể xử lý ảnh mặc định");
          setIsSaving(false);
          return;
        }
      } else if (defaultProductImageUrl && !defaultProductImage) {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
          const fullUrl = defaultProductImageUrl.startsWith('http') 
            ? defaultProductImageUrl 
            : `${API_BASE}${defaultProductImageUrl}`;

          const response = await fetch(fullUrl, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch image');
          }
          
          const blob = await response.blob();
          defaultImageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error fetching default image:", error);
          // Nếu không thể tải ảnh mới, sử dụng URL gốc
          defaultImageUrl = defaultProductImageUrl;
        }
      }

      // Validate default image
      if (!defaultImageUrl) {
        toast.error("Vui lòng chọn ảnh mặc định cho sản phẩm");
        setIsSaving(false);
        return;
      }

      // Chỉ xử lý các biến thể của màu đã chọn
      for (const colorId of selectedColors) {
        const sizes = variantValues[colorId] || {};
        const selectedSizes = selectedSizesByColor[colorId] || [];
        
        // Validate màu mới phải có ít nhất một size và ảnh
        if (!selectedSizes.length) {
          toast.error(`Màu ${colors.find(c => String(c.id_mau_sac) === colorId)?.ten_mau_sac} chưa chọn kích cỡ`);
          return;
        }
        
        if (!variantImages[colorId]?.length) {
          toast.error(`Màu ${colors.find(c => String(c.id_mau_sac) === colorId)?.ten_mau_sac} chưa có ảnh`);
          return;
        }

        // Chỉ xử lý các size đã được chọn
        for (const sizeId of selectedSizes) {
          const values = sizes[sizeId];
          if (!values) continue;

          const them_hinh_anh_spcts: ThemHinhAnhSanPhamChiTietAdminDTO[] = [];
          
          // Handle existing images
          if (variantImages[colorId]) {
            for (const imageUrl of variantImages[colorId]) {
              try {
                let base64: string;
                if (imageUrl instanceof File) {
                  base64 = await fileToBase64(imageUrl);
                } else {
                  // Nếu là URL, kiểm tra xem có phải là URL đầy đủ không
                  const fullUrl = imageUrl.startsWith('http') 
                    ? imageUrl 
                    : `${API_BASE}${imageUrl}`;

                  const response = await fetch(fullUrl, {
                    cache: 'no-store',
                    headers: {
                      'Cache-Control': 'no-cache',
                      'Pragma': 'no-cache'
                    }
                  });

                  if (!response.ok) {
                    throw new Error('Failed to fetch image');
                  }

                  const blob = await response.blob();
                  base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                }
                them_hinh_anh_spcts.push({
                  hinh_anh_urls: base64
                });
              } catch (error) {
                console.error("Error converting image to base64:", error);
                // Nếu không thể chuyển đổi ảnh, sử dụng URL gốc
                them_hinh_anh_spcts.push({
                  hinh_anh_urls: imageUrl instanceof File ? '' : imageUrl
                });
              }
            }
          }

          // Find existing variant ID from product data
          const existingVariant = product?.sanPhamChiTiets?.find(
            variant => String(variant.mauSac?.id_mau_sac) === colorId && String(variant.kichCo?.id_kich_co) === sizeId
          );

          // Tạo DTO cho biến thể
          const variantDTO: SuaSanPhamChiTietAdminDTO = {
            id_mau_sac: colorId,
            id_kich_co: sizeId,
            id_giam_gia: values.discount || "",
            so_luong: values.stock || 0,
            gia_ban: values.price || 0,
            gia_nhap: values.importPrice || 0,
            trang_thai: "HoatDong",
            them_hinh_anh_spcts,
            xoa_hinh_anh_ids: []
          };

          // Chỉ thêm id_san_pham_chi_tiet nếu là biến thể đã tồn tại
          if (existingVariant?.id_san_pham_chi_tiet) {
            variantDTO.id_san_pham_chi_tiet = existingVariant.id_san_pham_chi_tiet;
          }

          sanPhamChiTiets.push(variantDTO);
        }
      }

      // Update product
      const productData: UpdateSanPhamDTO = {
        ten_san_pham: data.ten_san_pham,
        mo_ta: data.mo_ta,
        id_thuong_hieu: data.id_thuong_hieu,
        id_kieu_dang: data.id_kieu_dang,
        id_chat_lieu: data.id_chat_lieu,
        id_xuat_xu: data.id_xuat_xu,
        id_danh_muc: data.id_danh_muc,
        trang_thai: data.trang_thai,
        url_anh_mac_dinh: defaultImageUrl,
        sanPhamChiTiets: sanPhamChiTiets
      };

      try {
        const response = await sanPhamService.capNhatSanPham(productId, productData);
        console.log('Update response:', response);
        
        // Đợi một chút để đảm bảo dữ liệu được cập nhật
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh dữ liệu sản phẩm
        const updatedProduct = await sanPhamService.getChiTietSanPham(productId);
        setProduct(updatedProduct);
        
        toast.success("Cập nhật sản phẩm thành công");
        router.push("/admin/products");
      } catch (error: any) {
        console.error("Error updating product:", error);
        toast.error(error?.response?.data || "Không thể cập nhật sản phẩm");
      }
    } catch (error: any) {
      console.error("Error updating product:", error);
      const errorMessage = error.response?.data || error.message || "Không thể cập nhật sản phẩm";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Không thể cập nhật sản phẩm");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      await sanPhamService.capNhatTrangThaiSanPham(
        productId,
        product?.trang_thai === "HoatDong" ? "KhongHoatDong" : "HoatDong"
      );
      setProduct({
        ...product!,
        trang_thai: product?.trang_thai === "HoatDong" ? "KhongHoatDong" : "HoatDong",
      });
      toast.success(
        product?.trang_thai === "HoatDong" 
          ? "Đã ngừng bán sản phẩm thành công" 
          : "Đã kích hoạt sản phẩm thành công"
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Không thể cập nhật trạng thái sản phẩm";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Không thể cập nhật trạng thái sản phẩm");
    } finally {
      setIsStatusDialogOpen(false);
    }
  };

  const handleDeleteColor = async () => {
    try {
      // Kiểm tra xem màu này có tồn tại trong sản phẩm gốc không
      const existingColor = product?.sanPhamChiTiets?.some(
        variant => String(variant.mauSac?.id_mau_sac) === colorToDelete
      );

      if (existingColor) {
        // Nếu màu tồn tại trong DB, gọi API xóa
        const response = await sanPhamService.xoaSanPhamChiTietTheoMauSac(productId, colorToDelete);
        if (response) {
          toast.success("Xóa màu sắc thành công");
        }
      }

      // Cập nhật state trong mọi trường hợp
      setSelectedColors(prev => prev.filter(id => id !== colorToDelete));
      if (selectedColorTab === colorToDelete) {
        setSelectedColorTab(selectedColors[0] || "");
      }
    } catch (error: any) {
      toast.error(error?.response?.data || "Không thể xóa màu sắc");
    } finally {
      setIsDeleteColorDialogOpen(false);
      setColorToDelete("");
    }
  };

  const handleDeleteSize = async () => {
    if (!sizeToDelete) return;
    try {
      const response = await sanPhamService.xoaSanPhamChiTietTheoKichCo(
        productId, 
        sizeToDelete.colorId, 
        sizeToDelete.sizeId
      );
      if (response) {
        toast.success("Xóa kích cỡ thành công");
        setSelectedSizesByColor(prev => ({
          ...prev,
          [sizeToDelete.colorId]: prev[sizeToDelete.colorId].filter(id => id !== sizeToDelete.sizeId)
        }));
      }
    } catch (error: any) {
      toast.error(error?.response?.data || "Không thể xóa kích cỡ");
    } finally {
      setIsDeleteSizeDialogOpen(false);
      setSizeToDelete(null);
    }
  };

  const handleToggleSizeForColor = (colorId: string, sizeId: string) => {
    // Kiểm tra xem kích cỡ này có active không
    const size = sizes.find(s => String(s.id_kich_co) === sizeId);
    if (!size) return;

    // Nếu kích cỡ không active và chưa được sử dụng trong sản phẩm, không cho phép thêm
    if (size.trang_thai !== 'HoatDong') {
      const existingVariant = product?.sanPhamChiTiets?.find(
        variant => String(variant.mauSac?.id_mau_sac) === colorId && String(variant.kichCo?.id_kich_co) === sizeId
      );
      
      if (!existingVariant) {
        toast.error("Không thể thêm kích cỡ không hoạt động");
        return;
      }
    }

    // Kiểm tra xem kích cỡ này đã tồn tại trong sản phẩm chưa
    const existingVariant = product?.sanPhamChiTiets?.find(
      variant => String(variant.mauSac?.id_mau_sac) === colorId && String(variant.kichCo?.id_kich_co) === sizeId
    );

    if (existingVariant) {
      // Nếu kích cỡ đã tồn tại trong sản phẩm, hiển thị dialog xác nhận xóa
      setSizeToDelete({ colorId, sizeId });
      setIsDeleteSizeDialogOpen(true);
      return;
    }

    // Kiểm tra xem size đã được thêm vào danh sách chưa
    const currentSizes = selectedSizesByColor[colorId] || [];
    if (currentSizes.includes(sizeId)) {
      // Nếu size đã tồn tại trong danh sách, xóa nó đi
      const updatedSizes = currentSizes.filter(size => size !== sizeId);
      setSelectedSizesByColor({
        ...selectedSizesByColor,
        [colorId]: updatedSizes
      });

      // Xóa các giá trị của size này
      const currentColorVariants = { ...variantValues[colorId] };
      delete currentColorVariants[sizeId];
      setVariantValues({
        ...variantValues,
        [colorId]: currentColorVariants
      });
      return;
    }

    // Thêm size mới vào danh sách
    const updatedSizes = [...currentSizes, sizeId];
    setSelectedSizesByColor({
      ...selectedSizesByColor,
      [colorId]: updatedSizes
    });

      // Khởi tạo giá trị mặc định cho kích cỡ mới
    const currentColorVariants = variantValues[colorId] || {};
    setVariantValues({
      ...variantValues,
      [colorId]: {
        ...currentColorVariants,
        [sizeId]: {
          stock: 0,
          importPrice: 0,
          price: 0,
          discount: [],
          images: []
        }
      }
    });
  };

  const handleQuickAddColor = async () => {
    try {
      await attributeService.createAttribute('MauSac', {
        ten_mau_sac: newQuickColor.ten_mau_sac,
        mo_ta: newQuickColor.mo_ta,
        trang_thai: "HoatDong"
      });
      
      // Refresh colors list
      const updatedColors = await attributeService.getAttributes('MauSac');
      setColors(updatedColors);
      
      // Reset form and close dialog
      setNewQuickColor({ ten_mau_sac: "", mo_ta: "" });
      setIsQuickAddColorOpen(false);
      
      toast.success("Thêm màu sắc thành công");
    } catch (error: any) {
      toast.error(error.response?.data || "Không thể thêm màu sắc");
    }
  };

  const handleQuickAddSize = async () => {
    try {
      await attributeService.createAttribute('KichCo', {
        ten_kich_co: newQuickSize.ten_kich_co,
        mo_ta: newQuickSize.mo_ta,
        trang_thai: "HoatDong"
      });
      
      // Refresh sizes list
      const updatedSizes = await attributeService.getAttributes('KichCo');
      setSizes(updatedSizes);
      
      // Reset form and close dialog
      setNewQuickSize({ ten_kich_co: "", mo_ta: "" });
      setIsQuickAddSizeOpen(false);
      
      toast.success("Thêm kích cỡ thành công");
    } catch (error: any) {
      toast.error(error.response?.data || "Không thể thêm kích cỡ");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-96 bg-slate-200 rounded" />
                <div className="h-32 bg-slate-200 rounded" />
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-slate-200 rounded" />
                <div className="h-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/admin/products")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Chỉnh sửa sản phẩm</h1>
              <p className="text-sm text-slate-500">
                Mã sản phẩm: {product.ma_san_pham}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={product.trang_thai === "HoatDong" ? "destructive" : "default"}
              onClick={() => setIsStatusDialogOpen(true)}
              className={product.trang_thai === "HoatDong" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
            >
              {product.trang_thai === "HoatDong" ? "Ngừng bán" : "Kích hoạt"}
            </Button>
            <Button 
              onClick={() => setIsSaveDialogOpen(true)} 
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>

        {/* Save Confirmation Dialog */}
        <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Lưu thay đổi?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn lưu các thay đổi cho sản phẩm này? Hành động này sẽ cập nhật thông tin sản phẩm và các biến thể.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsSaveDialogOpen(false);
                  form.handleSubmit(onSubmit)();
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Lưu thay đổi
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {product.trang_thai === "HoatDong" ? "Ngừng bán sản phẩm?" : "Kích hoạt sản phẩm?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {product.trang_thai === "HoatDong" 
                  ? "Sản phẩm sẽ không còn hiển thị trên trang web và không thể đặt hàng. Bạn có chắc chắn muốn ngừng bán sản phẩm này?"
                  : "Sản phẩm sẽ được hiển thị trên trang web và có thể đặt hàng. Bạn có chắc chắn muốn kích hoạt sản phẩm này?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStatusChange}
                className={product.trang_thai === "HoatDong" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
              >
                {product.trang_thai === "HoatDong" ? "Ngừng bán" : "Kích hoạt"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteColorDialogOpen} onOpenChange={setIsDeleteColorDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa màu sắc?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa màu <span className="font-bold">{colors.find(c => String(c.id_mau_sac) === colorToDelete)?.ten_mau_sac}</span> khỏi sản phẩm này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteColor} className="bg-red-500 hover:bg-red-600">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteSizeDialogOpen} onOpenChange={setIsDeleteSizeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa kích cỡ?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa kích cỡ <span className="font-bold">{sizes.find(s => String(s.id_kich_co) === sizeToDelete?.sizeId)?.ten_kich_co} </span> 
                của màu <span className="font-bold">{colors.find(c => String(c.id_mau_sac) === sizeToDelete?.colorId)?.ten_mau_sac}</span>? 
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSize} className="bg-red-500 hover:bg-red-600">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chung</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductGeneralInfoForm
                  product={{
                    ...form.getValues(),
                    sanPhamChiTiets: []
                  }}
                  errors={errors}
                  brands={brands}
                  styles={styles}
                  materials={materials}
                  origins={origins}
                  categories={categories}
                  onChange={(field, value) => {
                    if (field !== 'sanPhamChiTiets') {
                      form.setValue(field as any, value, { shouldValidate: true });
                      setPreviewImages(prev => [...prev]);
                    }
                  }}
                  tenSanPhamRef={tenSanPhamRef}
                  defaultProductImage={defaultProductImage}
                  setDefaultProductImage={setDefaultProductImage}
                  onPreview={(url) => setPreviewImages([url])}
                  defaultProductImageUrl={defaultProductImageUrl}
                  setDefaultProductImageUrl={setDefaultProductImageUrl}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Biến thể sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorTabs
                  selectedColors={selectedColors}
                  colors={colors}
                  selectedColorTab={selectedColorTab}
                  onTabChange={setSelectedColorTab}
                  onAddColor={(colorId) => setSelectedColors(prev => [...prev, colorId])}
                  onRemoveColor={(colorId) => {
                    setColorToDelete(colorId);
                    setIsDeleteColorDialogOpen(true);
                  }}
                  addColorOpen={addColorOpen}
                  setAddColorOpen={setAddColorOpen}
                  selectedSizesByColor={selectedSizesByColor}
                  sizes={sizes}
                  variantImages={variantImages}
                  errors={errors}
                  setVariantImages={setVariantImages}
                  setPreviewImageUrl={(url) => setPreviewImages([url])}
                  handleToggleSizeForColor={handleToggleSizeForColor}
                  discounts={discounts}
                  variantValues={variantValues}
                  handleVariantValueChange={(colorId, sizeId, field, value) => {
                    setVariantValues(prev => ({
                      ...prev,
                      [colorId]: {
                        ...prev[colorId],
                        [sizeId]: {
                          ...prev[colorId]?.[sizeId],
                          [field]: field === 'discount' ? (Array.isArray(value) ? value : value ? [value] : []) : value,
                        },
                      },
                    }));
                  }}
                  onDeleteColor={(colorId) => {
                    setColorToDelete(colorId);
                    setIsDeleteColorDialogOpen(true);
                  }}
                  onDeleteSize={(colorId, sizeId) => {
                    setSizeToDelete({ colorId, sizeId });
                    setIsDeleteSizeDialogOpen(true);
                  }}
                  addColorButton={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuickAddColorOpen(true)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm màu mới
                    </Button>
                  }
                  addSizeButton={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuickAddSizeOpen(true)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm cỡ mới
                    </Button>
                  }
                />
              </CardContent>
            </Card>
        </div>

        {/* Quick Add Color Dialog */}
        <Dialog open={isQuickAddColorOpen} onOpenChange={setIsQuickAddColorOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Thêm màu sắc mới</DialogTitle>
              <DialogDescription>
                Thêm nhanh màu sắc mới cho sản phẩm
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quick-color-name">Tên màu sắc <span className="text-red-500">*</span></Label>
                <Input
                  id="quick-color-name"
                  placeholder="Nhập tên màu sắc"
                  value={newQuickColor.ten_mau_sac}
                  onChange={(e) => setNewQuickColor(prev => ({ ...prev, ten_mau_sac: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-color-desc">Mô tả</Label>
                <Input
                  id="quick-color-desc"
                  placeholder="Nhập mô tả"
                  value={newQuickColor.mo_ta}
                  onChange={(e) => setNewQuickColor(prev => ({ ...prev, mo_ta: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuickAddColorOpen(false)}>Hủy</Button>
              <Button onClick={handleQuickAddColor} disabled={!newQuickColor.ten_mau_sac}>Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Add Size Dialog */}
        <Dialog open={isQuickAddSizeOpen} onOpenChange={setIsQuickAddSizeOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Thêm kích cỡ mới</DialogTitle>
              <DialogDescription>
                Thêm nhanh kích cỡ mới cho sản phẩm
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quick-size-name">Tên kích cỡ <span className="text-red-500">*</span></Label>
                <Input
                  id="quick-size-name"
                  placeholder="Nhập tên kích cỡ"
                  value={newQuickSize.ten_kich_co}
                  onChange={(e) => setNewQuickSize(prev => ({ ...prev, ten_kich_co: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-size-desc">Mô tả</Label>
                <Input
                  id="quick-size-desc"
                  placeholder="Nhập mô tả"
                  value={newQuickSize.mo_ta}
                  onChange={(e) => setNewQuickSize(prev => ({ ...prev, mo_ta: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuickAddSizeOpen(false)}>Hủy</Button>
              <Button onClick={handleQuickAddSize} disabled={!newQuickSize.ten_kich_co}>Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 