import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ThemSanPhamAdminDTO } from '@/types/san-pham';
import { ThemSanPhamChiTietAdminDTO } from '@/types/san-pham-chi-tiet';
import { ThuongHieu } from '@/types/thuong-hieu';
import { KieuDang } from '@/types/kieu-dang';
import { ChatLieu } from '@/types/chat-lieu';
import { XuatXu } from '@/types/xuat-xu';
import { DanhMuc } from '@/types/danh-muc';
import { GiamGia } from '@/types/giam-gia';
import { MauSac } from '@/types/mau-sac';
import { KichCo } from '@/types/kich-co';
import { attributeService } from '@/services/attribute.service';
import { sanPhamService } from '@/services/san-pham.service';
import toast from 'react-hot-toast';
import axios from 'axios';
import { debug } from 'node:util';

export function useProductForm(router: any, defaultProductImage: File | null, setDefaultProductImage: (val: File | null) => void) {
  const [product, setProduct] = useState<ThemSanPhamAdminDTO>({
    ten_san_pham: '', mo_ta: '', id_thuong_hieu: '', id_kieu_dang: '', id_chat_lieu: '', id_xuat_xu: '', id_danh_muc: '', url_anh_mac_dinh: '', sanPhamChiTiets: []
  });
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizesByColor, setSelectedSizesByColor] = useState<Record<string, string[]>>({});
  const [variantValues, setVariantValues] = useState<Record<string, Record<string, { stock: number; importPrice: number; price: number; discount: string; images: File[] }>>>({});
  const [addColorOpen, setAddColorOpen] = useState(false);
  const tenSanPhamRef = useRef<HTMLInputElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedColorTab, setSelectedColorTab] = useState<string>('');
  const [variantImages, setVariantImages] = useState<Record<string, File[]>>({});
  const [previewImageUrl, setPreviewImageUrl] = useState<string|null>(null);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [pendingUnloadEvent, setPendingUnloadEvent] = useState<BeforeUnloadEvent|null>(null);
  const [pendingRoute, setPendingRoute] = useState<string|null>(null);
  const [brands, setBrands] = useState<ThuongHieu[]>([]);
  const [styles, setStyles] = useState<KieuDang[]>([]);
  const [materials, setMaterials] = useState<ChatLieu[]>([]);
  const [origins, setOrigins] = useState<XuatXu[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [discounts, setDiscounts] = useState<GiamGia[]>([]);
  const [colors, setColors] = useState<MauSac[]>([]);
  const [sizes, setSizes] = useState<KichCo[]>([]);

  useEffect(() => {
    if (defaultProductImage) {
      readFileAsBase64(defaultProductImage).then(url => {
        setProduct(prev => ({ ...prev, url_anh_mac_dinh: url }));
      });
    } else {
      setProduct(prev => ({ ...prev, url_anh_mac_dinh: '' }));
    }
  }, [defaultProductImage]);

  useEffect(() => { tenSanPhamRef.current?.focus(); }, []);

  const handleProductChange = useCallback((field: keyof ThemSanPhamAdminDTO, value: string) => {
    setProduct(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, [setProduct, setIsDirty, setErrors]);

  const handleVariantValueChange = useCallback((colorId: string, sizeId: string, field: 'stock' | 'importPrice' | 'price' | 'discount' | 'images', value: any) => {
    setVariantValues(prev => ({
      ...prev,
      [colorId]: {
        ...(prev[colorId] || {}),
        [sizeId]: {
          ...(prev[colorId]?.[sizeId] || { stock: 0, importPrice: 0, price: 0, discount: '', images: [] }),
          [field]: value
        }
      }
    }));
    setIsDirty(true);
    if (['stock', 'importPrice', 'price'].includes(field)) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[`${colorId}_${sizeId}_${field}`];
        return copy;
      });
    }
  }, [setVariantValues, setIsDirty, setErrors]);

  const handleToggleColor = useCallback((colorId: string) => {
    setSelectedColors(prev => prev.includes(colorId) ? prev.filter(id => id !== colorId) : [...prev, colorId]);
    setIsDirty(true);
  }, [setSelectedColors, setIsDirty]);

  const handleToggleSizeForColor = useCallback((colorId: string, sizeId: string) => {
    setSelectedSizesByColor(prev => {
      const prevSizes = prev[colorId] || [];
      const newSizes = prevSizes.includes(sizeId)
        ? prevSizes.filter(id => id !== sizeId)
        : [...prevSizes, sizeId];
      return { ...prev, [colorId]: newSizes };
    });
    setIsDirty(true);
  }, [setSelectedSizesByColor, setIsDirty]);

  const handleAddColorTab = useCallback((colorId: string) => {

    // Kiểm tra xem màu đã được chọn chưa
    if (selectedColors.includes(colorId)) {
      return;
    }

    // Chỉ cập nhật selectedColors và selectedColorTab
    setSelectedColors(prev => {
      const newColors = [...prev, colorId];
      return newColors;
    });
    setSelectedColorTab(colorId);
  }, [selectedColors]);

  // Sử dụng useEffect để đồng bộ hóa sanPhamChiTiets với selectedColors
  useEffect(() => {

    // Tạo một Set chứa các id_mau_sac hiện có trong sanPhamChiTiets
    const existingColorIds = new Set(product.sanPhamChiTiets.map(ct => ct.id_mau_sac));
    
    // Tìm các màu mới cần thêm vào
    const colorsToAdd = selectedColors.filter(colorId => !existingColorIds.has(colorId));
    
    if (colorsToAdd.length > 0) {
      setProduct(prevProduct => {
        const newChiTiets = [
          ...prevProduct.sanPhamChiTiets,
          ...colorsToAdd.map(colorId => ({
            id_mau_sac: colorId,
            id_kich_co: '',
            so_luong: 0,
            gia_nhap: 0,
            gia_ban: 0,
            id_giam_gia: '',
            them_hinh_anh_spcts: []
          }))
        ];
        return {
          ...prevProduct,
          sanPhamChiTiets: newChiTiets
        };
      });
    }
  }, [selectedColors, product.sanPhamChiTiets]);

  const handleRemoveColorTab = useCallback((colorId: string) => {
    setSelectedColors(prev => prev.filter(id => id !== colorId));
    setSelectedColorTab(selectedColors.length > 1 ? selectedColors.find(id => id !== colorId) || '' : '');
    setSelectedSizesByColor(prev => { const copy = { ...prev }; delete copy[colorId]; return copy; });
    setVariantValues(prev => { const copy = { ...prev }; delete copy[colorId]; return copy; });
    setProduct(prevProduct => ({
      ...prevProduct,
      sanPhamChiTiets: prevProduct.sanPhamChiTiets.filter(ct => ct.id_mau_sac !== colorId)
    }));
  }, [setSelectedColors, setSelectedColorTab, selectedColors, setSelectedSizesByColor, setVariantValues, setProduct]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        setPendingUnloadEvent(e);
        setShowLeaveAlert(true);
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    attributeService.getAttributes('ThuongHieu').then(setBrands);
    attributeService.getAttributes('KieuDang').then(setStyles);
    attributeService.getAttributes('ChatLieu').then(setMaterials);
    attributeService.getAttributes('XuatXu').then(setOrigins);
    attributeService.getAttributes('DanhMuc').then(setCategories);
    attributeService.getAttributes('MauSac').then(setColors);
    attributeService.getAttributes('KichCo').then(setSizes);
    // TODO: Gọi API chương trình giảm giá nếu có, hoặc để mock
  }, []);

  // Danh sách biến thể (chiTiets) được tính toán lại nhiều lần, nên bọc useMemo
  const chiTiets = useMemo(() => {
    const result: any[] = [];
    selectedColors.forEach(colorId => {
      const sizes = selectedSizesByColor[colorId] || [];
      sizes.forEach(sizeId => {
        if (!sizeId) return;
        const values = variantValues[colorId]?.[sizeId] || {};
        result.push({
          id_mau_sac: colorId,
          id_kich_co: sizeId,
          so_luong: values.stock || 0,
          gia_nhap: values.importPrice || 0,
          gia_ban: values.price || 0,
          id_chuong_trinh_giam_gia: values.discount || '',
          them_hinh_anh_spcts: (variantImages[colorId] || [])
        });
      });
    });
    return result;
  }, [selectedColors, selectedSizesByColor, variantValues, variantImages]);

  useEffect(() => {
    setProduct(prev => ({ ...prev, sanPhamChiTiets: chiTiets }));
  }, [chiTiets, setProduct]);

  // Helper: scroll to first error
  const scrollToFirstError = () => {
    const errorFields = [
      'ten_san_pham', 'id_thuong_hieu', 'id_kieu_dang', 'id_chat_lieu', 'id_xuat_xu', 'id_danh_muc',
      'sanPhamChiTiets', 'defaultImage'
    ];
    for (const field of errorFields) {
      if (errors[field]) {
        const el = document.querySelector(`[data-error-field="${field}"]`);
        if (el) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }
  };

  // Submit handler
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Hàm kiểm tra ảnh trùng lặp
  const checkDuplicateImages = async (files: File[]): Promise<{ isDuplicate: boolean; message: string }> => {
    // Kiểm tra tên file trùng lặp
    const fileNames = new Set<string>();
    for (const file of files) {
      if (fileNames.has(file.name)) {
        return {
          isDuplicate: true,
          message: `Ảnh ${file.name} đã được tải lên trước đó`
        };
      }
      fileNames.add(file.name);
    }

    // Nếu không có tên file trùng lặp, kiểm tra nội dung ảnh
    const imageHashes = new Set<string>();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashString = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (imageHashes.has(hashString)) {
        return {
          isDuplicate: true,
          message: `Ảnh ${file.name} có nội dung giống với ảnh đã tải lên trước đó`
        };
      }
      imageHashes.add(hashString);
    }
    
    return { isDuplicate: false, message: '' };
  };

  // Hàm kiểm tra ảnh trùng lặp khi tải lên
  const checkDuplicateImagesOnUpload = async (newImages: File[], colorId: string) => {
    // Thu thập tất cả ảnh từ tất cả các màu
    const allImages: File[] = [];
    Object.entries(variantImages).forEach(([id, images]) => {
      if (id !== colorId) { // Không bao gồm ảnh của màu đang tải lên
        allImages.push(...images);
      }
    });
    allImages.push(...newImages); // Thêm ảnh mới vào để kiểm tra

    const { isDuplicate, message } = await checkDuplicateImages(allImages);
    if (isDuplicate) {
      toast.error(message);
      return false;
    }
    return true;
  };

  // Cập nhật hàm setVariantImages
  const updateVariantImages = async (colorId: string, images: File[]) => {
    const isValid = await checkDuplicateImagesOnUpload(images, colorId);
    if (!isValid) {
      return;
    }
    
    setVariantImages(prev => ({
      ...prev,
      [colorId]: images
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    console.log('handleSubmit - Starting submit process');
    console.log('handleSubmit - Current default image:', defaultProductImage);
    console.log('handleSubmit - Variant images:', variantImages);
    
    // Validate form
    const newErrors: { [key: string]: string } = {};
    
    // Validate default image
    if (!defaultProductImage) {
      console.log('handleSubmit - No default image found');
      newErrors.defaultImage = 'Vui lòng chọn ảnh mặc định cho sản phẩm';
    } else {
      console.log('handleSubmit - Default image exists:', defaultProductImage);
    }

    if (!product.ten_san_pham.trim()) newErrors.ten_san_pham = 'Tên sản phẩm là bắt buộc';
    if (!product.mo_ta.trim()) newErrors.mo_ta = 'Mô tả sản phẩm là bắt buộc';  
    if (!product.id_thuong_hieu) newErrors.id_thuong_hieu = 'Vui lòng chọn thương hiệu';
    if (!product.id_kieu_dang) newErrors.id_kieu_dang = 'Vui lòng chọn kiểu dáng';
    if (!product.id_chat_lieu) newErrors.id_chat_lieu = 'Vui lòng chọn chất liệu';
    if (!product.id_xuat_xu) newErrors.id_xuat_xu = 'Vui lòng chọn xuất xứ';
    if (!product.id_danh_muc) newErrors.id_danh_muc = 'Vui lòng chọn danh mục';
    if (product.sanPhamChiTiets.length === 0) newErrors.sanPhamChiTiets = 'Cần chọn ít nhất 1 màu sắc';

    product.sanPhamChiTiets.forEach((ct: ThemSanPhamChiTietAdminDTO) => {
      const color = colors.find(c => String(c.id_mau_sac) === ct.id_mau_sac);
      const colorName = color ? color.ten_mau_sac : 'Màu chưa xác định';
      const prefix = `${ct.id_mau_sac}_${ct.id_kich_co}`;
      
      if (!ct.id_kich_co) newErrors[`${prefix}_size`] = `Cần chọn kích cỡ cho màu ${colorName}`;
      if (!ct.them_hinh_anh_spcts || ct.them_hinh_anh_spcts.length === 0) newErrors[`${prefix}_images`] = `Cần thêm hình ảnh cho màu ${colorName}`;
      if (!ct.so_luong || ct.so_luong <= 0) newErrors[`${prefix}_stock`] = `Số lượng phải lớn hơn 0 cho màu ${colorName}`;
      if (!ct.gia_nhap || ct.gia_nhap <= 0) newErrors[`${prefix}_importPrice`] = `Giá nhập phải lớn hơn 0 cho màu ${colorName}`;
      if (!ct.gia_ban || ct.gia_ban <= 0) newErrors[`${prefix}_price`] = `Giá bán phải lớn hơn 0 cho màu ${colorName}`;
    });

    Object.entries(variantValues).forEach(([colorId, sizesObj]) => {
      const color = colors.find(c => String(c.id_mau_sac) === colorId);
      const colorName = color ? color.ten_mau_sac : 'Màu chưa xác định';
      
      Object.entries(sizesObj).forEach(([sizeId, values]) => {
        if (!values.stock || values.stock <= 0) newErrors[`${colorId}_${sizeId}_stock`] = `Số lượng phải lớn hơn 0 cho màu ${colorName}`;
        if (!values.importPrice || values.importPrice <= 0) newErrors[`${colorId}_${sizeId}_importPrice`] = `Giá nhập phải lớn hơn 0 cho màu ${colorName}`;
        if (!values.price || values.price <= 0) newErrors[`${colorId}_${sizeId}_price`] = `Giá bán phải lớn hơn 0 cho màu ${colorName}`;
        if (!variantImages[colorId] || variantImages[colorId].length === 0) newErrors[`${colorId}_images`] = `Cần thêm hình ảnh cho màu ${colorName}`;
      });
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setTimeout(scrollToFirstError, 100);
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }

    // Process all images first
    const imagePromises = Object.entries(variantImages).map(async ([colorId, files]) => {
      const processedImages = await Promise.all(
        (files as File[]).map(async (file) => {
          const imageUrl = await readFileAsBase64(file);
          return {
            hinh_anh_urls: imageUrl
          };
        })
      );
      return { colorId, processedImages };
    });
    
    const processedImagesMap = new Map(
      (await Promise.all(imagePromises)).map(({ colorId, processedImages }) => [colorId, processedImages])
    );

    // Process default image
    if (defaultProductImage) {
      const defaultImageUrl = await readFileAsBase64(defaultProductImage);
      setProduct(prev => ({ ...prev, url_anh_mac_dinh: defaultImageUrl }));
    }

    // Create chiTiets with processed images
    const newChiTiets: ThemSanPhamChiTietAdminDTO[] = [];
    
    // Now create the chiTiets with the processed images
    for (const colorId of selectedColors) {
      const sizes = selectedSizesByColor[colorId] || [];
      for (const sizeId of sizes) {
        if (!sizeId) continue;
        const values = variantValues[colorId]?.[sizeId] || {};
        const images = processedImagesMap.get(colorId) || [];
        
        newChiTiets.push({
          id_mau_sac: colorId,
          id_kich_co: sizeId,
          so_luong: values.stock || 0,
          gia_nhap: values.importPrice || 0,
          gia_ban: values.price || 0,
          id_giam_gia: values.discount || '',
          them_hinh_anh_spcts: images
        });
      }
    }

    const payload = { ...product, sanPhamChiTiets: newChiTiets };
    // Clean up the payload by removing any duplicate arrays
    const cleanPayload = { ...payload };
    delete (cleanPayload as any).SanPhamChiTiets;
    console.log('Final payload:', JSON.stringify(cleanPayload, null, 2));
    try {
      await sanPhamService.themSanPham(cleanPayload);
      toast.success('Thêm sản phẩm thành công!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error submitting product:', error);
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error('Có lỗi xảy ra khi thêm sản phẩm!');
      }
    }
  };

  return {
    product, setProduct,
    selectedColors, setSelectedColors,
    selectedSizesByColor, setSelectedSizesByColor,
    variantValues, setVariantValues,
    addColorOpen, setAddColorOpen,
    tenSanPhamRef,
    isDirty, setIsDirty,
    errors, setErrors,
    selectedColorTab, setSelectedColorTab,
    variantImages, setVariantImages,
    updateVariantImages,
    previewImageUrl, setPreviewImageUrl,
    showLeaveAlert, setShowLeaveAlert,
    pendingUnloadEvent, setPendingUnloadEvent,
    pendingRoute, setPendingRoute,
    defaultProductImage, setDefaultProductImage,
    brands, setBrands,
    styles, setStyles,
    materials, setMaterials,
    origins, setOrigins,
    categories, setCategories,
    discounts, setDiscounts,
    colors, setColors,
    sizes, setSizes,
    handleProductChange,
    handleVariantValueChange,
    handleToggleColor,
    handleToggleSizeForColor,
    handleAddColorTab,
    handleRemoveColorTab,
    handleSubmit,
    scrollToFirstError,
    originalPush: router.push,
  };
}