ALTER TABLE `Major`
    ADD COLUMN `matrixData` LONGTEXT NULL,
    ADD COLUMN `enabledCoursesData` LONGTEXT NULL;

ALTER TABLE `CourseYear`
    ADD COLUMN `semester` INTEGER NULL;
