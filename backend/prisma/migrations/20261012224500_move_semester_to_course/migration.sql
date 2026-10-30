ALTER TABLE `Course`
    ADD COLUMN `semester` INTEGER NULL;

UPDATE `Course` AS course
SET `semester` = (
    SELECT course_year.`semester`
    FROM `CourseYear` AS course_year
    INNER JOIN `AcademicYear` AS academic_year
        ON academic_year.`id` = course_year.`academicYearId`
    WHERE course_year.`courseId` = course.`id`
        AND course_year.`semester` IS NOT NULL
    ORDER BY academic_year.`year` ASC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1
    FROM `CourseYear` AS course_year
    WHERE course_year.`courseId` = course.`id`
        AND course_year.`semester` IS NOT NULL
);

ALTER TABLE `CourseYear`
    DROP COLUMN `semester`;
