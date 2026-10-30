CREATE TABLE `DashboardSurveyForm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `isCdr` BOOLEAN NOT NULL DEFAULT false,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DashboardSurveyForm_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DashboardSurveyQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dashboardFormId` INTEGER NOT NULL,
    `questionText` LONGTEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'single',
    `required` BOOLEAN NOT NULL DEFAULT true,
    `options` LONGTEXT NOT NULL,
    `groupNo` INTEGER NOT NULL DEFAULT 1,
    `groupTitle` VARCHAR(255) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DashboardSurveyQuestion_dashboardFormId_sortOrder_idx`(`dashboardFormId`, `sortOrder`),
    PRIMARY KEY (`id`),
    CONSTRAINT `DashboardSurveyQuestion_dashboardFormId_fkey`
        FOREIGN KEY (`dashboardFormId`) REFERENCES `DashboardSurveyForm`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DashboardSurveyResponse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dashboardFormId` INTEGER NOT NULL,
    `answers` LONGTEXT NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DashboardSurveyResponse_dashboardFormId_submittedAt_idx`(`dashboardFormId`, `submittedAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `DashboardSurveyResponse_dashboardFormId_fkey`
        FOREIGN KEY (`dashboardFormId`) REFERENCES `DashboardSurveyForm`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
