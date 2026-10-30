import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';

@Injectable()
export class MajorsService {
  constructor(private readonly prisma: PrismaService) { }

  findAll() {
    return this.prisma.major.findMany({
      include: {
        plos: true,
        clos: true,
        courses: true,
        assessments: true,
        majorYears: {
          include: {
            academicYear: true,
          }
        }
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.major.findUnique({
      where: { id },
      include: {
        plos: {
          include: {
            matrices: {
              select: {
                id: true,
                cloId: true,
                level: true,
                clo: {
                  select: {
                    id: true,
                    code: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
        clos: true,
        courses: {
          include: {
            courseYears: {
              include: {
                academicYear: {
                  select: { year: true },
                },
              },
            },
          },
        },
        assessments: true,
        majorYears: {
          include: {
            academicYear: true,
          }
        }
      },
    });
  }

  create(dto: CreateMajorDto) {
    return this.prisma.major.create({
      data: dto,
    });
  }

  async update(id: number, dto: any) {
    // 1. Update assessments if thresholds are provided
    if (dto.ploThreshold !== undefined || dto.cloThreshold !== undefined) {
      const ploRate = dto.ploThreshold !== undefined ? Number(dto.ploThreshold) : 75;
      const cloRate = dto.cloThreshold !== undefined ? Number(dto.cloThreshold) : 3;

      const assessments = await this.prisma.assessment.findMany({
        where: { majorId: id }
      });

      if (assessments.length > 0) {
        await this.prisma.assessment.updateMany({
          where: { majorId: id },
          data: {
            ploRate,
            cloRate,
            createdAt: new Date() // Set update time
          }
        });
      } else {
        await this.prisma.assessment.create({
          data: {
            majorId: id,
            ploRate,
            cloRate,
            createdAt: new Date()
          }
        });
      }
    }

    // 2. Update Major fields
    const { code, name, description, matrixData, enabledCoursesData } = dto;
    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (matrixData !== undefined) updateData.matrixData = matrixData;
    if (enabledCoursesData !== undefined) updateData.enabledCoursesData = enabledCoursesData;

    if (Object.keys(updateData).length > 0) {
      return this.prisma.major.update({
        where: { id },
        data: updateData,
        include: {
          plos: true,
          clos: true,
          courses: true,
          assessments: true,
        }
      });
    }

    return this.findOne(id);
  }

  remove(id: number) {
    return this.prisma.major.delete({
      where: { id },
    });
  }
}