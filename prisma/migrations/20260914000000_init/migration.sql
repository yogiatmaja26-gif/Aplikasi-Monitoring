-- Migration 20260914000000_init: RAP Material Control System MySQL 8+ Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'PROJECT_MANAGER', 'PURCHASING', 'SUPERVISOR', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_code` VARCHAR(50) NOT NULL UNIQUE,
  `project_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `location` VARCHAR(255) NULL,
  `start_date` DATE NULL,
  `target_end_date` DATE NULL,
  `status` ENUM('PLANNING', 'ONGOING', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'PLANNING',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_projects_code` (`project_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Work Categories Table
CREATE TABLE IF NOT EXISTS `work_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `category_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_work_categories_project` (`project_id`),
  CONSTRAINT `fk_work_categories_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Vendors Table
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_name` VARCHAR(255) NOT NULL,
  `contact_person` VARCHAR(191) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Materials Table
CREATE TABLE IF NOT EXISTS `materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `vendor_id` INT NULL,
  `material_code` VARCHAR(100) NOT NULL UNIQUE,
  `material_name` VARCHAR(255) NOT NULL,
  `specification` TEXT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `planned_quantity` DECIMAL(12, 4) NOT NULL,
  `rap_unit_price` DECIMAL(15, 2) NOT NULL,
  `rap_total_price` DECIMAL(15, 2) NOT NULL,
  `location` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `source_excel_reference` VARCHAR(255) NULL,
  `procurement_status` ENUM('NOT_PURCHASED', 'DP_PARTIALLY_PURCHASED', 'PURCHASED') NOT NULL DEFAULT 'NOT_PURCHASED',
  `receiving_status` ENUM('NOT_RECEIVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED') NOT NULL DEFAULT 'NOT_RECEIVED',
  `installation_status` ENUM('NOT_INSTALLED', 'PARTIALLY_INSTALLED', 'INSTALLED') NOT NULL DEFAULT 'NOT_INSTALLED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_materials_project` (`project_id`),
  INDEX `idx_materials_category` (`category_id`),
  INDEX `idx_materials_vendor` (`vendor_id`),
  INDEX `idx_materials_code` (`material_code`),
  CONSTRAINT `fk_materials_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_materials_category` FOREIGN KEY (`category_id`) REFERENCES `work_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_materials_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Purchase Transactions Table
CREATE TABLE IF NOT EXISTS `purchase_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT NOT NULL,
  `vendor_id` INT NULL,
  `purchase_date` DATE NOT NULL,
  `quantity` DECIMAL(12, 4) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `unit_price` DECIMAL(15, 2) NOT NULL,
  `total_price` DECIMAL(15, 2) NOT NULL,
  `payment_status` ENUM('UNPAID', 'DP', 'PARTIALLY_PAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
  `dp_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `remaining_payment` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `invoice_number` VARCHAR(100) NULL,
  `invoice_file_url` TEXT NULL,
  `notes` TEXT NULL,
  `created_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_purchases_material` (`material_id`),
  INDEX `idx_purchases_vendor` (`vendor_id`),
  INDEX `idx_purchases_creator` (`created_by`),
  CONSTRAINT `fk_purchases_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchases_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_purchases_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Material Receipts Table
CREATE TABLE IF NOT EXISTS `material_receipts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT NOT NULL,
  `purchase_transaction_id` INT NOT NULL,
  `received_date` DATE NOT NULL,
  `quantity_received` DECIMAL(12, 4) NOT NULL,
  `receiver_name` VARCHAR(191) NULL,
  `delivery_photo_url` TEXT NULL,
  `notes` TEXT NULL,
  `created_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_receipts_material` (`material_id`),
  INDEX `idx_receipts_purchase` (`purchase_transaction_id`),
  INDEX `idx_receipts_creator` (`created_by`),
  CONSTRAINT `fk_receipts_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_receipts_purchase` FOREIGN KEY (`purchase_transaction_id`) REFERENCES `purchase_transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_receipts_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Installation Transactions Table
CREATE TABLE IF NOT EXISTS `installation_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT NOT NULL,
  `installation_date` DATE NOT NULL,
  `quantity_installed` DECIMAL(12, 4) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `location` VARCHAR(255) NULL,
  `installer_name` VARCHAR(191) NULL,
  `installation_photo_url` TEXT NULL,
  `notes` TEXT NULL,
  `created_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_installations_material` (`material_id`),
  INDEX `idx_installations_creator` (`created_by`),
  CONSTRAINT `fk_installations_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_installations_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Material Images Table
CREATE TABLE IF NOT EXISTS `material_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT NOT NULL,
  `image_type` ENUM('REFERENCE', 'PURCHASE', 'DELIVERY', 'INSTALLATION', 'OTHER') NOT NULL DEFAULT 'REFERENCE',
  `image_url` TEXT NOT NULL,
  `caption` TEXT NULL,
  `uploaded_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_images_material` (`material_id`),
  INDEX `idx_images_uploader` (`uploaded_by`),
  CONSTRAINT `fk_images_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_images_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Project Documents Table
CREATE TABLE IF NOT EXISTS `project_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `material_id` INT NULL,
  `document_type` VARCHAR(100) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_url` TEXT NOT NULL,
  `uploaded_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_docs_project` (`project_id`),
  INDEX `idx_docs_material` (`material_id`),
  CONSTRAINT `fk_docs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_docs_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_docs_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Activity Logs Table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` INT NULL,
  `description` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_logs_user` (`user_id`),
  INDEX `idx_logs_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
