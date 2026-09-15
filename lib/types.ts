// RAP Material Control System - Type Definitions

export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'PURCHASING' | 'SUPERVISOR' | 'VIEWER';

export type ProjectStatus = 'PLANNING' | 'ONGOING' | 'COMPLETED' | 'ARCHIVED';

export type PaymentStatus = 'UNPAID' | 'DP' | 'PARTIALLY_PAID' | 'PAID';

export type ProcurementStatus = 'NOT_PURCHASED' | 'DP_PARTIALLY_PURCHASED' | 'PURCHASED';

export type ReceivingStatus = 'NOT_RECEIVED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED';

export type InstallationStatus = 'NOT_INSTALLED' | 'PARTIALLY_INSTALLED' | 'INSTALLED';

export type ImageType = 'REFERENCE' | 'PURCHASE' | 'DELIVERY' | 'INSTALLATION' | 'OTHER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  target_end_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at?: string;
}

export interface WorkCategory {
  id: number;
  project_id: number;
  category_name: string;
  description: string | null;
  created_at: string;
}

export interface Vendor {
  id: number;
  vendor_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Material {
  id: number;
  project_id: number;
  category_id: number;
  vendor_id: number | null;
  material_code: string;
  material_name: string;
  specification: string | null;
  unit: string;
  planned_quantity: number;
  rap_unit_price: number;
  rap_total_price: number;
  location: string | null;
  notes: string | null;
  source_excel_reference: string | null;
  procurement_status: ProcurementStatus;
  receiving_status: ReceivingStatus;
  installation_status: InstallationStatus;
  created_at: string;
  updated_at?: string;

  // Joined / computed fields
  category_name?: string;
  vendor_name?: string;
  project_name?: string;
  purchased_quantity?: number;
  received_quantity?: number;
  installed_quantity?: number;
  remaining_to_purchase?: number;
  remaining_to_receive?: number;
  remaining_to_install?: number;
  actual_total_cost?: number;
  total_dp_amount?: number;
  total_paid_amount?: number;
  primary_image_url?: string;
  progress_percentage?: number;
}

export interface PurchaseTransaction {
  id: number;
  material_id: number;
  vendor_id: number | null;
  purchase_date: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  payment_status: PaymentStatus;
  dp_amount: number;
  paid_amount: number;
  remaining_payment: number;
  invoice_number: string | null;
  invoice_file_url: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at?: string;

  // Joined
  material_name?: string;
  material_code?: string;
  vendor_name?: string;
  creator_name?: string;
}

export interface MaterialReceipt {
  id: number;
  material_id: number;
  purchase_transaction_id: number;
  received_date: string;
  quantity_received: number;
  receiver_name: string | null;
  delivery_photo_url: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;

  // Joined
  material_name?: string;
  material_code?: string;
  unit?: string;
  invoice_number?: string;
  creator_name?: string;
}

export interface InstallationTransaction {
  id: number;
  material_id: number;
  installation_date: string;
  quantity_installed: number;
  unit: string;
  location: string | null;
  installer_name: string | null;
  installation_photo_url: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;

  // Joined
  material_name?: string;
  material_code?: string;
  creator_name?: string;
}

export interface MaterialImage {
  id: number;
  material_id: number;
  image_type: ImageType;
  image_url: string;
  caption: string | null;
  uploaded_by: number | null;
  created_at: string;
  uploader_name?: string;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  created_at: string;
  user_name?: string;
}

export interface DashboardSummary {
  total_projects: number;
  total_material_items: number;
  total_rap_budget: number;
  total_actual_purchase: number;
  total_dp: number;
  total_paid: number;
  total_outstanding_payment: number;
  total_purchased_items: number;
  total_fully_received_items: number;
  total_installed_items: number;
  procurement_progress_percentage: number;
  installation_progress_percentage: number;
  status_distributions: {
    procurement: { name: string; value: number; color: string }[];
    receiving: { name: string; value: number; color: string }[];
    installation: { name: string; value: number; color: string }[];
  };
  rap_vs_actual_by_category: {
    category_name: string;
    rap_budget: number;
    actual_spent: number;
    item_count: number;
  }[];
  attention_lists: {
    not_purchased: Material[];
    dp_status: Material[];
    awaiting_delivery: Material[];
    awaiting_installation: Material[];
  };
  recent_purchases: PurchaseTransaction[];
  recent_installations: InstallationTransaction[];
}
