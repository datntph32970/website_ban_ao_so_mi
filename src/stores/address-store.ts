import { create } from 'zustand';

export interface Province {
  ProvinceID: number;
  ProvinceName: string;
}

export interface District {
  DistrictID: number;
  DistrictName: string;
  ProvinceID: number;
}

export interface Ward {
  WardCode: string;
  WardName: string;
  DistrictID: number;
}

interface AddressState {
  provinces: Province[];
  districts: District[];
  wards: Ward[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProvinces: (provinces: Province[]) => void;
  setDistricts: (districts: District[]) => void;
  setWards: (wards: Ward[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  provinces: [],
  districts: [],
  wards: [],
  isLoading: false,
  error: null,
};

export const useAddressStore = create<AddressState>((set) => ({
  ...initialState,

  setProvinces: (provinces) => set({ provinces }),
  setDistricts: (districts) => set({ districts, wards: [] }), // Reset wards when districts change
  setWards: (wards) => set({ wards }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ districts: [], wards: [], error: null }),
})); 