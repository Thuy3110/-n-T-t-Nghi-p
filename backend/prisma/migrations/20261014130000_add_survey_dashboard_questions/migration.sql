ALTER TABLE `SurveyForm`
    ADD COLUMN `description` TEXT NOT NULL,
    ADD COLUMN `isCdr` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE `SurveyQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `surveyFormId` INTEGER NOT NULL,
    `questionText` LONGTEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'single',
    `required` BOOLEAN NOT NULL DEFAULT true,
    `options` LONGTEXT NOT NULL,
    `groupNo` INTEGER NOT NULL DEFAULT 1,
    `groupTitle` VARCHAR(255) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SurveyQuestion_surveyFormId_sortOrder_idx`(`surveyFormId`, `sortOrder`),
    PRIMARY KEY (`id`),
    CONSTRAINT `SurveyQuestion_surveyFormId_fkey`
        FOREIGN KEY (`surveyFormId`) REFERENCES `SurveyForm`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SurveyResponse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `surveyFormId` INTEGER NOT NULL,
    `answers` LONGTEXT NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SurveyResponse_surveyFormId_submittedAt_idx`(`surveyFormId`, `submittedAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `SurveyResponse_surveyFormId_fkey`
        FOREIGN KEY (`surveyFormId`) REFERENCES `SurveyForm`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SurveyDashboardSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `cdrConversion` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
