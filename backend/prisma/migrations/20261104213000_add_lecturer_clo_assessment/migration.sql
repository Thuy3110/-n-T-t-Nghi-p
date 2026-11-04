CREATE TABLE `LecturerCloAssessment` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `courseId` INTEGER NOT NULL,
  `cloId` INTEGER NOT NULL,
  `academicYearId` INTEGER NOT NULL,
  `attainmentRate` DOUBLE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LecturerCloAssessment_userId_courseId_cloId_academicYearId_key` (`userId`, `courseId`, `cloId`, `academicYearId`),
  INDEX `LecturerCloAssessment_courseId_academicYearId_idx` (`courseId`, `academicYearId`),
  INDEX `LecturerCloAssessment_userId_academicYearId_idx` (`userId`, `academicYearId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `LecturerCloAssessment`
  ADD CONSTRAINT `LecturerCloAssessment_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LecturerCloAssessment`
  ADD CONSTRAINT `LecturerCloAssessment_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LecturerCloAssessment`
  ADD CONSTRAINT `LecturerCloAssessment_cloId_fkey`
  FOREIGN KEY (`cloId`) REFERENCES `CLO`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LecturerCloAssessment`
  ADD CONSTRAINT `LecturerCloAssessment_academicYearId_fkey`
  FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
