
// User type definition
export interface User {
  id: string;
  email: string;
  username?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  account_type: 'regular' | 'premium' | 'business';
  is_verified: boolean;
  is_active: boolean;
}

// Category type definition
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  color_hex?: string;
  sort_order: number;
  active_deal_count: string;
  business_count: string;
}

// Login credentials types
export interface LoginCredentials {
  email?: string;
  phone_number?: string;
  username?: string;
  password: string;
}

// Register data type
export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
}