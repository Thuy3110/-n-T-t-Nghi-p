CREATE TABLE `AnalysisSetting` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `ploThreshold` DOUBLE NOT NULL DEFAULT 75,
  `cloThreshold` DOUBLE NOT NULL DEFAULT 5,
  `enableContribution` BOOLEAN NOT NULL DEFAULT true,
  `enableSelfAssessment` BOOLEAN NOT NULL DEFAULT false,
  `contributionLevels` VARCHAR(100) NOT NULL DEFAULT 'I,R,M',
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `AnalysisSetting` (`id`, `updatedAt`) VALUES (1, CURRENT_TIMESTAMP(3));
