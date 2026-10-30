-- AlterTable
ALTER TABLE `dashboardsurveyform` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `surveyform` MODIFY `link` TEXT NOT NULL,
    MODIFY `legacyLink` TEXT NOT NULL,
    MODIFY `classes` TEXT NOT NULL,
    MODIFY `description` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `CourseCLO` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `cloId` INTEGER NOT NULL,

    INDEX `CourseCLO_cloId_idx`(`cloId`),
    UNIQUE INDEX `CourseCLO_courseId_cloId_key`(`courseId`, `cloId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CourseCLO` ADD CONSTRAINT `CourseCLO_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseCLO` ADD CONSTRAINT `CourseCLO_cloId_fkey` FOREIGN KEY (`cloId`) REFERENCES `CLO`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
