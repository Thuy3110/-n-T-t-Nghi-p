CREATE TABLE IF NOT EXISTS `CourseLecturer` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `courseId` INTEGER NOT NULL,
  `academicYearId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `CourseLecturer_userId_courseId_academicYearId_key` (`userId`, `courseId`, `academicYearId`),
  INDEX `CourseLecturer_courseId_idx` (`courseId`),
  INDEX `CourseLecturer_userId_idx` (`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CourseLecturer`
  ADD CONSTRAINT `CourseLecturer_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CourseLecturer`
  ADD CONSTRAINT `CourseLecturer_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CourseLecturer`
  ADD CONSTRAINT `CourseLecturer_academicYearId_fkey`
  FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

