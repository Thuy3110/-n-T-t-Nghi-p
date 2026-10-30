CREATE TABLE `Student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentCode` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `majorId` INTEGER NOT NULL,
    `cohortYear` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Student_studentCode_key`(`studentCode`),
    INDEX `Student_majorId_cohortYear_idx`(`majorId`, `cohortYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StudentCloScore` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `cloId` INTEGER NOT NULL,
    `score` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudentCloScore_studentId_courseId_cloId_key`(`studentId`, `courseId`, `cloId`),
    INDEX `StudentCloScore_courseId_cloId_idx`(`courseId`, `cloId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Student`
    ADD CONSTRAINT `Student_majorId_fkey`
    FOREIGN KEY (`majorId`) REFERENCES `Major`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StudentCloScore`
    ADD CONSTRAINT `StudentCloScore_studentId_fkey`
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `StudentCloScore`
    ADD CONSTRAINT `StudentCloScore_courseId_fkey`
    FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `StudentCloScore`
    ADD CONSTRAINT `StudentCloScore_cloId_fkey`
    FOREIGN KEY (`cloId`) REFERENCES `CLO`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
