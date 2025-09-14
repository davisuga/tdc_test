import { useQuery } from "@tanstack/react-query";

export interface Listing {
  id: string;
  vin: string;
  heading: string;
  price?: number;
  miles: number;
  msrp?: number;
  data_source: string;
  vdp_url: string;
  carfax_1_owner?: boolean;
  carfax_clean_title?: boolean;
  exterior_color: string;
  interior_color?: string;
  base_int_color?: string;
  base_ext_color: string;
  dom: number;
  dom_180: number;
  dom_active: number;
  dos_active: number;
  seller_type: string;
  inventory_type: string;
  stock_no?: string;
  last_seen_at: number;
  last_seen_at_date: Date;
}

export interface MarketCheckResponse {
  num_found: number;
  listings: Listing[];
}

interface MarketSearchParams {
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
}

const fetchMarketData = async (params: MarketSearchParams): Promise<MarketCheckResponse> => {
  const searchParams = new URLSearchParams({
    api_key: 'iGEVoVZQx9NgRtmUpPDSHKwXK0UACaBn',
    include_relevant_links: 'true',
    car_type: 'used',
  });
  
  if (params.year) searchParams.append('year', params.year.toString());
  if (params.make) searchParams.append('make', params.make);
  if (params.model) searchParams.append('model', params.model);
  
  const response = await fetch(
    `https://api.marketcheck.com/v2/search/car/active?${searchParams.toString()}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  
  return response.json();
};

export const useMarketData = (params: MarketSearchParams) => {
  return useQuery({
    queryKey: ['marketData', params],
    queryFn: () => fetchMarketData(params),
    enabled: !!(params.year && params.make && params.model), // Only fetch if we have basic vehicle info
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};