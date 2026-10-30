CREATE TABLE `SystemSetting` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `systemName` VARCHAR(150) NOT NULL DEFAULT 'NV-SMART-EDU',
  `institutionName` VARCHAR(255) NOT NULL DEFAULT 'Trường Đại học Kiến trúc Đà Nẵng',
  `supportEmail` VARCHAR(150) NOT NULL DEFAULT '',
  `supportPhone` VARCHAR(50) NOT NULL DEFAULT '',
  `defaultLanguage` VARCHAR(10) NOT NULL DEFAULT 'vi',
  `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `SystemSetting` (`id`, `updatedAt`) VALUES (1, CURRENT_TIMESTAMP(3));
