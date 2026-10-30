ALTER TABLE `PLO`
    ADD COLUMN `isGroupHeader` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `parentId` INTEGER NULL,
    ADD INDEX `PLO_majorId_parentId_idx`(`majorId`, `parentId`),
    ADD CONSTRAINT `PLO_parentId_fkey`
        FOREIGN KEY (`parentId`) REFERENCES `PLO`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;
