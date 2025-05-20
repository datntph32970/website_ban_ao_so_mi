"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { gioHangService } from "@/services/gio-hang.service";
import { khachHangService } from "@/services/khach-hang.service";
import { ghnService } from "@/services/ghn-service";
import { hoaDonService } from "@/services/hoa-don.service";
import { phuongThucThanhToanService } from "@/services/phuong-thuc-thanh-toan.service";
import { DiaChiDTO } from "@/types/khach-hang";
import { GioHangResponse } from "@/types/gio-hang";
import { HoaDonAdminDTO } from "@/types/hoa-don";
import { MapPin, CreditCard, Wallet, Tag, StickyNote, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import debounce from 'lodash/debounce';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Province, District, Ward } from "@/stores/address-store";
import { khuyenMaiService } from "@/services/khuyen-mai.service";

interface CapNhatHoaDonOnlineDTO {
  id_dia_chi_nhan_hang: string;
  phi_van_chuyen: number;
  ghi_chu?: string;
  id_khuyen_mai?: string;
  id_phuong_thuc_thanh_toan?: string;
}

const AddAddressDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ten_nguoi_nhan: '',
    so_dien_thoai: '',
    tinh: '',
    huyen: '',
    xa: '',
    dia_chi_cu_the: '',
    dia_chi_mac_dinh: false
  });

  // State for address data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Load provinces when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadProvinces();
    }
  }, [isOpen]);

  // Load provinces
  const loadProvinces = async () => {
    try {
      setIsLoadingProvinces(true);
      const data = await ghnService.getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
      toast.error('Không thể tải danh sách tỉnh/thành phố');
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  // Load districts when province changes
  const loadDistricts = async (provinceId: number) => {
    try {
      setIsLoadingDistricts(true);
      const data = await ghnService.getDistricts(provinceId);
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
      toast.error('Không thể tải danh sách quận/huyện');
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  // Load wards when district changes
  const loadWards = async (districtId: number) => {
    try {
      setIsLoadingWards(true);
      const data = await ghnService.getWards(districtId);
      setWards(data);
    } catch (error) {
      console.error('Error loading wards:', error);
      toast.error('Không thể tải danh sách phường/xã');
    } finally {
      setIsLoadingWards(false);
    }
  };

  // Handle province change
  const handleProvinceChange = (provinceId: string) => {
    const province = provinces.find(p => p.ProvinceID === parseInt(provinceId));
    if (province) {
      setSelectedProvince(province);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setFormData(prev => ({
        ...prev,
        tinh: province.ProvinceName,
        huyen: '',
        xa: ''
      }));
      loadDistricts(province.ProvinceID);
    }
  };

  // Handle district change
  const handleDistrictChange = (districtId: string) => {
    const district = districts.find(d => d.DistrictID === parseInt(districtId));
    if (district) {
      setSelectedDistrict(district);
      setSelectedWard(null);
      setFormData(prev => ({
        ...prev,
        huyen: district.DistrictName,
        xa: ''
      }));
      loadWards(district.DistrictID);
    }
  };

  // Handle ward change
  const handleWardChange = (wardCode: string) => {
    const ward = wards.find(w => w.WardCode === wardCode);
    if (ward) {
      setSelectedWard(ward);
      setFormData(prev => ({
        ...prev,
        xa: ward.WardName
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error('Vui lòng chọn đầy đủ địa chỉ');
      return;
    }

    try {
      setIsSubmitting(true);
      await khachHangService.createAddress(formData);
      toast.success('Thêm địa chỉ thành công');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding address:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm địa chỉ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm địa chỉ mới</DialogTitle>
          <DialogDescription>
            Vui lòng điền đầy đủ thông tin địa chỉ nhận hàng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="ten_nguoi_nhan">Tên người nhận</Label>
              <Input
                id="ten_nguoi_nhan"
                value={formData.ten_nguoi_nhan}
                onChange={(e) => setFormData({ ...formData, ten_nguoi_nhan: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="so_dien_thoai">Số điện thoại</Label>
              <Input
                id="so_dien_thoai"
                value={formData.so_dien_thoai}
                onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <Label>Tỉnh/Thành phố</Label>
              <Select
                value={selectedProvince?.ProvinceID.toString()}
                onValueChange={handleProvinceChange}
              >
                <SelectTrigger disabled={isLoadingProvinces}>
                  <SelectValue placeholder="Chọn tỉnh/thành phố" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem
                      key={province.ProvinceID}
                      value={province.ProvinceID.toString()}
                    >
                      {province.ProvinceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Quận/Huyện</Label>
              <Select
                value={selectedDistrict?.DistrictID.toString()}
                onValueChange={handleDistrictChange}
                disabled={!selectedProvince || isLoadingDistricts}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quận/huyện" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem
                      key={district.DistrictID}
                      value={district.DistrictID.toString()}
                    >
                      {district.DistrictName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Phường/Xã</Label>
              <Select
                value={selectedWard?.WardCode}
                onValueChange={handleWardChange}
                disabled={!selectedDistrict || isLoadingWards}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phường/xã" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem
                      key={ward.WardCode}
                      value={ward.WardCode}
                    >
                      {ward.WardName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="dia_chi_cu_the">Địa chỉ cụ thể</Label>
              <Input
                id="dia_chi_cu_the"
                value={formData.dia_chi_cu_the}
                onChange={(e) => setFormData({ ...formData, dia_chi_cu_the: e.target.value })}
                placeholder="Số nhà, tên đường"
                required
              />
            </div>
            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dia_chi_mac_dinh"
                  checked={formData.dia_chi_mac_dinh}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, dia_chi_mac_dinh: checked as boolean })
                  }
                />
                <Label htmlFor="dia_chi_mac_dinh">Đặt làm địa chỉ mặc định</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Thêm địa chỉ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddressDialog = ({
  isOpen,
  onClose,
  onSelect,
  currentAddressId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (addressId: string) => Promise<void>;
  currentAddressId?: string;
}) => {
  const [addresses, setAddresses] = useState<DiaChiDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(currentAddressId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddAddressDialogOpen, setIsAddAddressDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await khachHangService.getMyAddresses();
      setAddresses(response.addresses);
      if (!currentAddressId && response.addresses.length > 0) {
        setSelectedAddressId(response.addresses[0].id_dia_chi);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async () => {
    if (!selectedAddressId) {
      toast.error('Vui lòng chọn địa chỉ');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSelect(selectedAddressId);
      onClose();
    } catch (error) {
      console.error('Error selecting address:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAddressSuccess = () => {
    loadAddresses();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chọn địa chỉ nhận hàng</DialogTitle>
            <DialogDescription>
              Chọn địa chỉ nhận hàng từ danh sách hoặc thêm địa chỉ mới
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Bạn chưa có địa chỉ nào</p>
              </div>
            ) : (
              <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                {addresses.map((address) => (
                  <div
                    key={address.id_dia_chi}
                    className={`relative flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAddressId === address.id_dia_chi
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-600'
                    }`}
                  >
                    <RadioGroupItem
                      value={address.id_dia_chi}
                      id={address.id_dia_chi}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={address.id_dia_chi}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{address.ten_nguoi_nhan}</span>
                        {address.dia_chi_mac_dinh && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{address.so_dien_thoai}</p>
                      <p className="text-sm">
                        {address.dia_chi_cu_the}, {address.xa}, {address.huyen}, {address.tinh}
                      </p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddAddressDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm địa chỉ mới
            </Button>
            <Button
              type="button"
              onClick={handleSelect}
              disabled={isSubmitting || !selectedAddressId}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddAddressDialog
        isOpen={isAddAddressDialogOpen}
        onClose={() => setIsAddAddressDialogOpen(false)}
        onSuccess={handleAddAddressSuccess}
      />
    </>
  );
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<HoaDonAdminDTO | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    id_phuong_thuc_thanh_toan: string;
    ten_phuong_thuc_thanh_toan: string;
    ma_phuong_thuc_thanh_toan: string;
  }>>([]);
  const [note, setNote] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [promoList, setPromoList] = useState<any[]>([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);
  const [promoSearch, setPromoSearch] = useState("");

  useEffect(() => {
    if (orderId) {
      loadData();
    } else {
      router.push('/cart');
    }
  }, [orderId]);

  const loadData = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      const [orderResponse, paymentMethodsResponse] = await Promise.all([
        hoaDonService.getHoaDonByIdCuaKhachHang(orderId),
        phuongThucThanhToanService.getDanhSachPhuongThucThanhToanOnlineHoatDong()
      ]);

      setOrderData(orderResponse);
      setPaymentMethods(paymentMethodsResponse);
      
      // Set payment method from order data if exists, otherwise set first available method
      if (orderResponse.id_phuong_thuc_thanh_toan) {
        setPaymentMethod(orderResponse.id_phuong_thuc_thanh_toan);
      } else if (paymentMethodsResponse.length > 0) {
        setPaymentMethod(paymentMethodsResponse[0].id_phuong_thuc_thanh_toan);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.response?.data?.message || 'Không thể tải thông tin đơn hàng');
      router.push('/cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial note from order data
  useEffect(() => {
    if (orderData?.ghi_chu) {
      setNote(orderData.ghi_chu);
    }
  }, [orderData]);

  const updateNote = useCallback(
    debounce(async (newNote: string) => {
      if (!orderData) return;

      try {
        setIsUpdatingNote(true);
        await hoaDonService.capNhatHoaDonOnline(orderData.id_hoa_don, {
          phi_van_chuyen: Number(orderData.phi_van_chuyen || 0),
          ghi_chu: newNote,
          id_khuyen_mai: orderData.khuyenMai?.id_khuyen_mai
        });
        toast.success('Đã cập nhật ghi chú');
      } catch (error: any) {
        console.error('Error updating note:', error);
        toast.error(error.response?.data?.message || 'Không thể cập nhật ghi chú');
        // Revert back to previous note on error
        setNote(orderData.ghi_chu || '');
      } finally {
        setIsUpdatingNote(false);
      }
    }, 1000),
    [orderData]
  );

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    updateNote(newNote);
  };

  const handleApplyPromoCode = async (code?: string) => {
    const promo = (code !== undefined ? code : promoCode).trim();
    if (!promo || !orderData) {
      toast.error('Vui lòng nhập mã khuyến mãi');
      return;
    }
    try {
      setIsApplyingPromo(true);
      await hoaDonService.apDungKhuyenMai(orderData.id_hoa_don, promo);
      await loadData(); // Reload order data to get updated prices
      toast.success('Áp dụng mã khuyến mãi thành công');
    } catch (error: any) {
      console.error('Error applying promo code:', error);
      toast.error(error.response?.data || 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
      setPromoCode(''); // Clear invalid promo code
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handlePaymentMethodChange = async (value: string) => {
    if (!orderData) return;
    
    try {
      setIsUpdatingPayment(true);
      setPaymentMethod(value);

      await hoaDonService.capNhatHoaDonOnline(orderData.id_hoa_don, {
        phi_van_chuyen: Number(orderData.phi_van_chuyen || 0),
        id_phuong_thuc_thanh_toan: value,
        ghi_chu: note,
        id_khuyen_mai: orderData.khuyenMai?.id_khuyen_mai
      });

      toast.success('Đã cập nhật phương thức thanh toán');
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật phương thức thanh toán');
      // Revert back to previous selection on error
      setPaymentMethod(orderData.id_phuong_thuc_thanh_toan || '');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderData) {
      toast.error("Không tìm thấy đơn hàng");
      return;
    }

    if (!orderData.dia_chi_nhan_hang) {
      toast.error("Vui lòng cập nhật địa chỉ nhận hàng");
      return;
    }

    if (!paymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }

    try {
      setIsPlacingOrder(true);
      
      // Cập nhật thông tin hóa đơn lần cuối
      await hoaDonService.capNhatHoaDonOnline(orderData.id_hoa_don, {
        phi_van_chuyen: orderData.phi_van_chuyen || 0,
        ghi_chu: note,
        id_khuyen_mai: orderData.khuyenMai?.id_khuyen_mai,
        id_phuong_thuc_thanh_toan: paymentMethod
      });

      // Xác nhận đặt hàng
      const response = await hoaDonService.xacNhanDatHang(orderData.id_hoa_don);

      if (response.redirect_url) {
        window.location.href = response.redirect_url;
      } else {
        toast.success("Đặt hàng thành công");
        router.push("/account/orders");
      }
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.response?.data?.message || "Không thể đặt hàng");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleAddressSelect = async (addressId: string) => {
    if (!orderData) return;

    try {
      setIsUpdatingAddress(true);

      // Get address details to calculate shipping fee
      const addresses = await khachHangService.getMyAddresses();
      const selectedAddress = addresses.addresses.find(addr => addr.id_dia_chi === addressId);
      
      if (!selectedAddress) {
        throw new Error('Không tìm thấy địa chỉ');
      }

      // Calculate shipping fee
      const districtId = await ghnService.findDistrictId(selectedAddress.tinh, selectedAddress.huyen);
      if (!districtId) {
        throw new Error('Không tìm thấy mã quận/huyện');
      }

      const wardCode = await ghnService.findWardCode(districtId, selectedAddress.xa);
      if (!wardCode) {
        throw new Error('Không tìm thấy mã phường/xã');
      }

      // Prepare items for shipping calculation
      const items = orderData.hoaDonChiTiets?.map(item => ({
        name: item.sanPhamChiTiet.ten_san_pham,
        quantity: item.so_luong,
        length: 20, // cm - kích thước áo khi gấp gọn
        width: 15,  // cm
        height: 3,  // cm
        weight: 200 // gram - trọng lượng trung bình của một áo sơ mi
      })) || [];

      // Calculate shipping fee
      const shippingFeeResponse = await ghnService.calculateShippingFee({
        to_district_id: districtId,
        to_ward_code: wardCode,
        items,
        insurance_value: orderData.tong_tien_don_hang
      });

      // Update order with new address and shipping fee
      await hoaDonService.capNhatHoaDonOnline(orderData.id_hoa_don, {
        id_dia_chi_nhan_hang: addressId,
        phi_van_chuyen: Number(shippingFeeResponse.total),
        id_khuyen_mai: orderData.khuyenMai?.id_khuyen_mai,
        ghi_chu: orderData.ghi_chu,
        id_phuong_thuc_thanh_toan: orderData.id_phuong_thuc_thanh_toan
      });

      await loadData();
      toast.success('Đã cập nhật địa chỉ nhận hàng');
    } catch (error: any) {
      console.error('Error updating address:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật địa chỉ nhận hàng');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  // Add useEffect to set promo code from order data
  useEffect(() => {
    if (orderData?.khuyenMai?.ma_khuyen_mai) {
      setPromoCode(orderData.khuyenMai.ma_khuyen_mai);
    }
  }, [orderData]);

  // Function to fetch active promotions
  const fetchPromotions = async (search = "") => {
    setIsLoadingPromos(true);
    try {
      const res = await khuyenMaiService.getActivePromotions({ search, id_hoa_don: orderData?.id_hoa_don });
      setPromoList(res.khuyen_mais || []);
    } catch (e) {
      toast.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setIsLoadingPromos(false);
    }
  };

  // Load promotions when dialog opens
  useEffect(() => {
    if (isPromoDialogOpen) {
      fetchPromotions(promoSearch);
    }
  }, [isPromoDialogOpen, promoSearch]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 w-1/4 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h1>
          <p className="text-slate-500 mb-8">Đơn hàng không tồn tại hoặc đã bị hủy</p>
          <Link href="/cart">
            <Button>Quay lại giỏ hàng</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Địa chỉ giao hàng
                  </h2>
                  <div className="mt-4">
                            {orderData.dia_chi_nhan_hang ? (
          <>
            <p className="font-medium">{orderData.ten_khach_hang}</p>
            <p className="text-sm text-slate-500 mt-1">{orderData.sdt_khach_hang}</p>
            <p className="text-sm mt-2">{orderData.dia_chi_nhan_hang}</p>
          </>
        ) : (
                      <p className="text-sm text-slate-500">Vui lòng chọn địa chỉ nhận hàng</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddressDialogOpen(true)}
                  disabled={isUpdatingAddress}
                >
                  {isUpdatingAddress ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Thay đổi'
                  )}
                </Button>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="font-medium mb-4">Sản phẩm</h2>
              <div className="space-y-4">
                {orderData?.hoaDonChiTiets?.map((item) => (
                  <div key={item.id_hoa_don_chi_tiet} className="flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={getImageUrl(item.sanPhamChiTiet.url_anh_san_pham_chi_tiet || '')}
                        alt={item.sanPhamChiTiet.ten_san_pham}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2">{item.sanPhamChiTiet.ten_san_pham}</p>
                      <div className="text-sm text-slate-500 mt-1 space-x-4">
                        <span>Màu: {item.sanPhamChiTiet.ten_mau_sac}</span>
                        <span>Size: {item.sanPhamChiTiet.ten_kich_co}</span>
                        <span>SL: {item.so_luong}</span>
                      </div>
                      <div className="mt-2">
                        {item.gia_sau_giam_gia !== item.don_gia ? (
                          <div>
                            <span className="font-medium text-blue-600">
                              {formatCurrency(item.gia_sau_giam_gia)}
                            </span>
                            <span className="text-sm text-slate-500 line-through ml-2">
                              {formatCurrency(item.don_gia)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium">{formatCurrency(item.don_gia)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Note and Promotion Code Card */}
            <Card className="p-6">
              <div className="space-y-6">
                {/* Note Section */}
                <div>
                  <h2 className="font-medium mb-2 flex items-center gap-2">
                    <StickyNote className="h-5 w-5" />
                    Ghi chú đơn hàng
                  </h2>
                  <div className="relative">
                    <Textarea
                      placeholder="Nhập ghi chú cho đơn hàng của bạn (không bắt buộc)"
                      value={note}
                      onChange={handleNoteChange}
                      className={`w-full ${isUpdatingNote ? 'opacity-50' : ''}`}
                      disabled={isUpdatingNote}
                      rows={3}
                    />
                    {isUpdatingNote && (
                      <div className="absolute right-2 top-2">
                        <span className="text-sm text-slate-500">Đang cập nhật...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Promotion Code Section */}
                <div>
                  <h2 className="font-medium mb-2 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Mã khuyến mãi
                  </h2>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã khuyến mãi"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1"
                        disabled={isApplyingPromo || orderData?.khuyenMai != null}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setIsPromoDialogOpen(true)}
                        disabled={isApplyingPromo || orderData?.khuyenMai != null}
                      >
                        Chọn mã
                      </Button>
                      {orderData?.khuyenMai ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPromoCode('');
                            hoaDonService.capNhatHoaDonOnline(orderData.id_hoa_don, {
                              phi_van_chuyen: Number(orderData.phi_van_chuyen || 0),
                              ghi_chu: note,
                              id_khuyen_mai: undefined
                            }).then(() => {
                              loadData();
                              toast.success('Đã hủy mã khuyến mãi');
                            }).catch((error) => {
                              toast.error('Không thể hủy mã khuyến mãi');
                            });
                          }}
                          disabled={isApplyingPromo}
                        >
                          {isApplyingPromo ? 'Đang xử lý...' : 'Hủy mã'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleApplyPromoCode()}
                          disabled={isApplyingPromo || !promoCode.trim()}
                        >
                          {isApplyingPromo ? 'Đang áp dụng...' : 'Áp dụng'}
                        </Button>
                      )}
                    </div>
                    {orderData?.khuyenMai && (
                      <div className="text-sm text-green-600">
                        Đã áp dụng: Giảm {orderData.khuyenMai.loai_khuyen_mai === 'PhanTram' 
                          ? `${orderData.khuyenMai.gia_tri_khuyen_mai}%` 
                          : formatCurrency(orderData.khuyenMai.gia_tri_khuyen_mai)
                        }
                        {orderData.khuyenMai.gia_tri_giam_toi_da && 
                          ` (tối đa ${formatCurrency(orderData.khuyenMai.gia_tri_giam_toi_da)})`
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method Card */}
            <Card className="p-6">
              <h2 className="font-medium mb-4">Phương thức thanh toán</h2>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={handlePaymentMethodChange}
                disabled={isUpdatingPayment}
              >
                {paymentMethods.map((method) => (
                  <div key={method.id_phuong_thuc_thanh_toan} className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem 
                      value={method.id_phuong_thuc_thanh_toan} 
                      id={method.id_phuong_thuc_thanh_toan}
                      disabled={isUpdatingPayment}
                    />
                    <Label 
                      htmlFor={method.id_phuong_thuc_thanh_toan} 
                      className={`flex items-center gap-2 ${isUpdatingPayment ? 'opacity-50' : ''}`}
                    >
                      {method.ma_phuong_thuc_thanh_toan === 'COD' ? (
                        <Wallet className="h-5 w-5" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                      {method.ten_phuong_thuc_thanh_toan}
                      {isUpdatingPayment && paymentMethod === method.id_phuong_thuc_thanh_toan && (
                        <span className="text-sm text-slate-500 ml-2">(Đang cập nhật...)</span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 lg:sticky lg:top-24 z-50">
              <h2 className="font-medium mb-4">Tổng đơn hàng</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tạm tính ({orderData?.hoaDonChiTiets?.length || 0} sản phẩm)</span>
                  <span>{formatCurrency(orderData?.tong_tien_don_hang || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Phí vận chuyển</span>
                  <span>{formatCurrency(orderData.phi_van_chuyen)}</span>
                </div>
                {orderData.so_tien_khuyen_mai > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Giảm giá</span>
                    <span className="text-green-600">-{formatCurrency(orderData.so_tien_khuyen_mai)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-medium">Tổng cộng</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(orderData.tong_tien_phai_thanh_toan)}
                </span>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Đặt hàng"
                )}
              </Button>

              <p className="text-xs text-slate-500 mt-4 text-center">
                Bằng cách nhấn "Đặt hàng", bạn đồng ý với các điều khoản và điều kiện của chúng tôi
              </p>
            </Card>
          </div>
        </div>
      </div>

      <AddressDialog
        isOpen={isAddressDialogOpen}
        onClose={() => setIsAddressDialogOpen(false)}
        onSelect={handleAddressSelect}
        currentAddressId={orderData?.dia_chi_nhan_hang}
      />

      <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chọn mã khuyến mãi</DialogTitle>
            <DialogDescription>
              Danh sách các mã khuyến mãi đang hoạt động
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <Input
              placeholder="Tìm kiếm tên hoặc mã khuyến mãi..."
              value={promoSearch}
              onChange={e => setPromoSearch(e.target.value)}
            />
          </div>
          {isLoadingPromos ? (
            <div className="flex justify-center py-8">
              <span>Đang tải...</span>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {promoList.length === 0 ? (
                <div className="text-center text-slate-500 py-8">Không có khuyến mãi nào</div>
              ) : (
                <div className="space-y-4">
                  {promoList.map((promo) => (
                    <div
                      key={promo.khuyenMai.id_khuyen_mai}
                      className="border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700 tracking-wider">
                            {promo.khuyenMai.ma_khuyen_mai}
                          </span>
                          <span className="text-sm font-medium text-blue-600 line-clamp-1">{promo.khuyenMai.ten_khuyen_mai}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-1">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            {promo.giaTriHienThi}
                          </span>
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            Số lượng còn lại: {promo.khuyenMai.so_luong_toi_da - promo.khuyenMai.so_luong_da_su_dung}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          <span className="mr-2">Thời gian áp dụng:</span>
                          <span className="font-medium">
                            {new Date(promo.khuyenMai.thoi_gian_bat_dau).toLocaleString('vi-VN')} - {new Date(promo.khuyenMai.thoi_gian_ket_thuc).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {promo.khuyenMai.mo_ta && (
                          <div className="mt-1 text-xs text-slate-400 italic line-clamp-2">{promo.khuyenMai.mo_ta}</div>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
                          onClick={async () => {
                            setIsPromoDialogOpen(false);
                            setPromoCode(promo.khuyenMai.ma_khuyen_mai);
                            handleApplyPromoCode(promo.khuyenMai.ma_khuyen_mai);
                          }}
                        >
                          Áp dụng
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 