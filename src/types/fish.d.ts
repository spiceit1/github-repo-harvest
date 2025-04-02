
declare interface FishData {
  uniqueId: string;
  name: string;
  searchName: string;
  category?: string;
  size?: string;
  cost?: string | number;
  price?: string | number;
  description?: string;
  qtyoh?: number;
  original_cost?: number;
  sale_cost?: number;
  disabled?: boolean;
  archived?: boolean;
  searchUrl?: string;
}
