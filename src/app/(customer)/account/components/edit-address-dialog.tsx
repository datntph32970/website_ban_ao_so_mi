"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { DiaChiDTO } from "@/types/khach-hang";
import { khachHangService } from "@/services/khach-hang.service";
import { ghnService } from "@/services/ghn-service";
import { Province, District, Ward } from "@/stores/address-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

const formSchema = z.object({
  ten_nguoi_nhan: z.string().min(1, "Vui lòng nhập tên người nhận"),
  so_dien_thoai: z.string()
    .regex(/^0[0-9]{9}$/, "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 số bắt đầu bằng số 0")
    .min(1, "Vui lòng nhập số điện thoại"),
  dia_chi_cu_the: z.string().min(1, "Vui lòng nhập địa chỉ cụ thể"),
  tinh: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
  huyen: z.string().min(1, "Vui lòng chọn quận/huyện"),
  xa: z.string().min(1, "Vui lòng chọn phường/xã"),
});

interface EditAddressDialogProps {
  address: DiaChiDTO;
  onSuccess: () => void;
}

export default function EditAddressDialog({ address, onSuccess }: EditAddressDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ten_nguoi_nhan: address.ten_nguoi_nhan,
      so_dien_thoai: address.so_dien_thoai,
      dia_chi_cu_the: address.dia_chi_cu_the,
      tinh: address.tinh,
      huyen: address.huyen,
      xa: address.xa,
    },
  });

  useEffect(() => {
    if (open) {
      loadProvinces();
    }
  }, [open]);

  const loadProvinces = async () => {
    try {
      const data = await ghnService.getProvinces();
      setProvinces(data);
      
      // Load districts for current province
      const province = data.find(p => p.ProvinceName === address.tinh);
      if (province) {
        loadDistricts(province.ProvinceID);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
      toast.error("Không thể tải danh sách tỉnh thành");
    }
  };

  const loadDistricts = async (provinceId: number) => {
    try {
      const data = await ghnService.getDistricts(provinceId);
      setDistricts(data);
      
      // Load wards for current district
      const district = data.find(d => d.DistrictName === address.huyen);
      if (district) {
        loadWards(district.DistrictID);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
      toast.error("Không thể tải danh sách quận huyện");
    }
  };

  const loadWards = async (districtId: number) => {
    try {
      const data = await ghnService.getWards(districtId);
      setWards(data);
    } catch (error) {
      console.error('Error loading wards:', error);
      toast.error("Không thể tải danh sách phường xã");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await khachHangService.updateAddress(address.id_dia_chi, values);
      toast.success("Cập nhật địa chỉ thành công");
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error("Không thể cập nhật địa chỉ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa địa chỉ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ten_nguoi_nhan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên người nhận</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên người nhận" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="so_dien_thoai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập số điện thoại" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tinh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tỉnh/Thành phố</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const province = provinces.find((p) => p.ProvinceName === value);
                        if (province) {
                          loadDistricts(province.ProvinceID);
                        }
                        form.setValue("huyen", "");
                        form.setValue("xa", "");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tỉnh/thành" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem
                            key={province.ProvinceID}
                            value={province.ProvinceName}
                          >
                            {province.ProvinceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="huyen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quận/Huyện</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const district = districts.find((d) => d.DistrictName === value);
                        if (district) {
                          loadWards(district.DistrictID);
                        }
                        form.setValue("xa", "");
                      }}
                      value={field.value}
                      disabled={!form.getValues("tinh")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn quận/huyện" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem
                            key={district.DistrictID}
                            value={district.DistrictName}
                          >
                            {district.DistrictName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="xa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phường/Xã</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.getValues("huyen")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phường/xã" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem
                            key={ward.WardCode}
                            value={ward.WardName}
                          >
                            {ward.WardName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dia_chi_cu_the"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ cụ thể</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập số nhà, tên đường..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 