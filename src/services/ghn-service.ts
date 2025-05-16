import { Province, District, Ward } from '@/stores/address-store';
import { api } from '@/lib/api';

const GHN_TOKEN = "c5a07264-26a0-11ef-ad6a-e6aec6d1ae72";
const GHN_SHOP_ID = 5123377;
const GHN_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api";
const SHOP_DISTRICT_ID = 1484; // Quận/Huyện của shop

// Cache for provinces data
let provincesCache: Province[] = [];

interface ShippingFeeItem {
  name: string;
  quantity: number;
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface CalculateShippingFeeParams {
  to_district_id: number;
  to_ward_code: string;
  items: ShippingFeeItem[];
  insurance_value?: number;
}

interface ShippingFeeResponse {
  total: number;
  service_fee: number;
  insurance_fee: number;
  pick_station_fee: number;
  coupon_value: number;
  r2s_fee: number;
  document_return: number;
  double_check: number;
  cod_fee: number;
  pick_remote_areas_fee: number;
  deliver_remote_areas_fee: number;
  cod_failed_fee: number;
}

interface ShopInfo {
  district_id: number;
  ward_code: string;
  // Thêm các trường khác nếu cần
}

export const ghnService = {
  async getProvinces(): Promise<Province[]> {
    // Return cached data if available
    if (provincesCache.length > 0) {
      return provincesCache;
    }

    const response = await fetch(`${GHN_BASE_URL}/master-data/province`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Token: GHN_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch provinces");
    }

    const data = await response.json();
    if (data.data && Array.isArray(data.data)) {
      provincesCache = data.data;
      return data.data;
    }

    throw new Error("Invalid provinces data");
  },

  async getDistricts(provinceId: number): Promise<District[]> {
    const response = await fetch(`${GHN_BASE_URL}/master-data/district`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Token: GHN_TOKEN,
      },
      body: JSON.stringify({ province_id: provinceId }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch districts");
    }

    const data = await response.json();
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    throw new Error("Invalid districts data");
  },

  async getWards(districtId: number): Promise<Ward[]> {
    const response = await fetch(`${GHN_BASE_URL}/master-data/ward`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Token: GHN_TOKEN,
      },
      body: JSON.stringify({ district_id: districtId }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch wards");
    }

    const data = await response.json();
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    throw new Error("Invalid wards data");
  },

  async getShopInfo(): Promise<ShopInfo> {
    const response = await fetch(`${GHN_BASE_URL}/v2/shop/detail`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Token: GHN_TOKEN,
        ShopId: GHN_SHOP_ID.toString(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get shop information");
    }

    const data = await response.json();
    if (data.code !== 200) {
      throw new Error(data.message || "Failed to get shop information");
    }

    return {
      district_id: data.data.district_id,
      ward_code: data.data.ward_code,
    };
  },

  async calculateShippingFee({
    to_district_id,
    to_ward_code,
    items,
    insurance_value = 0,
  }: CalculateShippingFeeParams): Promise<ShippingFeeResponse> {
    // Tính tổng khối lượng từ items
    const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    
    // Tính kích thước tổng theo quy tắc của GHN
    const length = Math.max(...items.map(item => item.length));
    const width = Math.max(...items.map(item => item.width));
    const height = items.reduce((sum, item) => sum + (item.height * item.quantity), 0);

    const response = await fetch(`${GHN_BASE_URL}/v2/shipping-order/fee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Token: GHN_TOKEN,
        ShopId: GHN_SHOP_ID.toString(),
      },
      body: JSON.stringify({
        service_type_id: 2, // Dịch vụ chuẩn
        from_district_id: SHOP_DISTRICT_ID,
        to_district_id,
        to_ward_code,
        insurance_value,
        weight: totalWeight,
        length,
        width,
        height,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to calculate shipping fee");
    }

    const data = await response.json();
    if (data.code !== 200) {
      throw new Error(data.message || "Failed to calculate shipping fee");
    }

    return data.data;
  },

  async findDistrictId(provinceName: string, districtName: string): Promise<number | null> {
    try {
      const provinces = await this.getProvinces();
      const province = provinces.find(p => p.ProvinceName === provinceName);
      if (!province) return null;

      const districts = await this.getDistricts(province.ProvinceID);
      const district = districts.find(d => d.DistrictName === districtName);
      return district?.DistrictID || null;
    } catch (error) {
      console.error('Error finding district ID:', error);
      return null;
    }
  },

  async findWardCode(districtId: number, wardName: string): Promise<string | null> {
    try {
      const wards = await this.getWards(districtId);
      const ward = wards.find(w => w.WardName === wardName);
      return ward?.WardCode || null;
    } catch (error) {
      console.error('Error finding ward code:', error);
      return null;
    }
  },
}; 