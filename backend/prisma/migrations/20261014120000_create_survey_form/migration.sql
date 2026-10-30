CREATE TABLE `SurveyForm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` VARCHAR(32) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `link` TEXT NOT NULL,
    `level` VARCHAR(10) NOT NULL DEFAULT 'LV1',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `legacyLink` TEXT NOT NULL,
    `menu` VARCHAR(20) NOT NULL DEFAULT 'main',
    `classes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SurveyForm_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
