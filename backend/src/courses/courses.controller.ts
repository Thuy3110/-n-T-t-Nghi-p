
import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    ParseIntPipe,
    BadRequestException,
} from '@nestjs/common';

import { CoursesService } from './courses.service';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class CoursesController {
    constructor(
        private readonly coursesService: CoursesService,
    ) { }

    // GET /courses
    // GET /courses?majorId=6
    @Get()
    findAll(@Query('majorId') majorId?: string) {
        if (majorId === undefined) {
            return this.coursesService.findAll();
        }

        const parsedMajorId = Number(majorId);

        if (
            !Number.isInteger(parsedMajorId) ||
            parsedMajorId <= 0
        ) {
            throw new BadRequestException(
                'majorId phải là số nguyên dương',
            );
        }

        return this.coursesService.findAll(parsedMajorId);
    }

    // GET /courses/cohorts?majorId=7
    @Get('cohorts')
    findCohorts(@Query('majorId') majorId?: string) {
        const parsedMajorId = Number(majorId);

        if (!Number.isInteger(parsedMajorId) || parsedMajorId <= 0) {
            throw new BadRequestException(
                'majorId pháº£i lÃ  sá»‘ nguyÃªn dÆ°Æ¡ng',
            );
        }

        return this.coursesService.findCohorts(parsedMajorId);
    }

    // GET /courses/10
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.coursesService.findOne(id);
    }

    // PATCH /courses/10
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCourseDto,
    ) {
        return this.coursesService.update(id, dto);
    }

    @Patch(':id/semester')
    updateSemester(
        @Param('id', ParseIntPipe) id: number,
        @Body('semester') semester: number,
    ) {
        return this.coursesService.updateSemester(id, Number(semester));
    }
}
