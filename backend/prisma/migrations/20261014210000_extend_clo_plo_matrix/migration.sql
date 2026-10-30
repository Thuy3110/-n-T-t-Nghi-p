ALTER TABLE `Matrix`
    ADD COLUMN `courseId` INTEGER NULL,
    ADD COLUMN `method` VARCHAR(10) NOT NULL DEFAULT 'TT',
    ADD INDEX `Matrix_courseId_idx`(`courseId`),
    ADD CONSTRAINT `Matrix_courseId_fkey`
        FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;
