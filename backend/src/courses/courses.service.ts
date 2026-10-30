
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    // GET /courses
    // GET /courses?majorId=7
    // GET /courses?majorId=7&cohortYear=2025
    async findAll(
        majorId?: number,
        cohortYear?: number,
    ) {
        return this.prisma.course.findMany({
            where: {
                ...(majorId !== undefined && {
                    majorId,
                }),
                ...(cohortYear !== undefined && {
                    cohortLinks: {
                        some: {
                            cohort: {
                                year: cohortYear,
                            },
                        },
                    },
                }),
            },
            include: {
                major: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    // Lấy những khóa có môn học thuộc ngành được chọn
    async findCohorts(majorId: number) {
        const major = await this.prisma.major.findUnique({
            where: { id: majorId },
            select: { id: true },
        });

        if (!major) {
            throw new NotFoundException(
                `Không tìm thấy ngành có ID ${majorId}`,
            );
        }

        const cohorts = await this.prisma.cohort.findMany({
            where: {
                courseLinks: {
                    some: {
                        course: {
                            majorId,
                        },
                    },
                },
            },
            select: {
                id: true,
                year: true,
            },
            orderBy: {
                year: 'desc',
            },
        });

        return cohorts;
    }

    // GET /courses/:id
    async findOne(id: number) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                major: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });

        if (!course) {
            throw new NotFoundException(
                `Không tìm thấy học phần có ID ${id}`,
            );
        }

        return course;
    }

    // PATCH /courses/:id
    // Cập nhật thông tin học phần trong MySQL
    async update(
        id: number,
        dto: UpdateCourseDto,
    ) {
        const course = await this.prisma.course.findUnique({
            where: { id },
        });

        if (!course) {
            throw new NotFoundException(
                `Không tìm thấy học phần có ID ${id}`,
            );
        }

        return this.prisma.course.update({
            where: { id },
            data: {
                ...(dto.code !== undefined && {
                    code: dto.code,
                }),
                ...(dto.name !== undefined && {
                    name: dto.name,
                }),
                ...(dto.credits !== undefined && {
                    credits: dto.credits,
                }),
                ...(dto.moduleCode !== undefined && {
                    moduleCode: dto.moduleCode,
                }),
                ...(dto.replacementCode !== undefined && {
                    replacementCode: dto.replacementCode,
                }),
                ...(dto.replacementName !== undefined && {
                    replacementName: dto.replacementName,
                }),
            },
            include: {
                major: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
    }

    async updateSemester(id: number, semester: number) {
        if (!Number.isInteger(semester) || semester < 1 || semester > 3) {
            throw new BadRequestException('Học kỳ phải là số nguyên từ 1 đến 3.');
        }

        const course = await this.prisma.course.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!course) {
            throw new NotFoundException(`Không tìm thấy học phần có ID ${id}`);
        }

        return this.prisma.course.update({
            where: { id },
            data: { semester },
            select: { id: true, semester: true },
        });
    }
}
