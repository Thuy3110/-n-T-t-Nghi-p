import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSurveyFormDto } from './dto/create-survey-form.dto';
import { CreateDashboardSurveyFormDto } from './dto/create-dashboard-survey-form.dto';
import { UpdateSurveyDashboardSettingDto } from './dto/update-survey-dashboard-setting.dto';
import { UpdateDashboardSurveyFormDto } from './dto/update-dashboard-survey-form.dto';
import { UpdateSurveyQuestionsDto } from './dto/update-survey-questions.dto';
import { UpdateSurveyFormDto } from './dto/update-survey-form.dto';

@Injectable()
export class SurveysService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.surveyForm
      .findMany({
        orderBy: [{ year: 'desc' }, { id: 'desc' }],
        include: {
          _count: {
            select: { questions: true, responses: true },
          },
        },
      })
      .then((forms) =>
        forms.map(({ _count, ...survey }) => ({
          ...survey,
          questionCount: _count.questions,
          responseCount: _count.responses,
        })),
      );
  }

  async getDashboard() {
    const [totalForms, activeForms, responseCount, questionCount, recentForms, setting] =
      await Promise.all([
        this.prisma.dashboardSurveyForm.count(),
        this.prisma.dashboardSurveyForm.count({ where: { enabled: true } }),
        this.prisma.dashboardSurveyResponse.count(),
        this.prisma.dashboardSurveyQuestion.count(),
        this.prisma.dashboardSurveyForm.findMany({
          take: 3,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: { questions: true, responses: true },
            },
          },
        }),
        this.prisma.surveyDashboardSetting.upsert({
          where: { id: 1 },
          create: { id: 1 },
          update: {},
        }),
      ]);

    return {
      totalForms,
      activeForms,
      responseCount,
      questionCount,
      cdrConversion: setting.cdrConversion,
      recentForms: recentForms.map(({ _count, ...survey }) => ({
        ...survey,
        questionCount: _count.questions,
        responseCount: _count.responses,
      })),
    };
  }

  updateDashboardSettings(dto: UpdateSurveyDashboardSettingDto) {
    return this.prisma.surveyDashboardSetting.upsert({
      where: { id: 1 },
      create: { id: 1, cdrConversion: dto.cdrConversion },
      update: { cdrConversion: dto.cdrConversion },
    });
  }

  findDashboardForms() {
    return this.prisma.dashboardSurveyForm
      .findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { questions: true, responses: true },
          },
        },
      })
      .then((forms) =>
        forms.map(({ _count, ...form }) => ({
          ...form,
          questionCount: _count.questions,
          responseCount: _count.responses,
        })),
      );
  }

  async createDashboardForm(dto: CreateDashboardSurveyFormDto) {
    try {
      return await this.prisma.dashboardSurveyForm.create({
        data: {
          code: dto.code.trim(),
          title: dto.title.trim(),
          description: dto.description?.trim() ?? '',
          isCdr: dto.isCdr ?? false,
          enabled: dto.enabled ?? true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Mã phiếu Dashboard đã tồn tại.');
      }
      throw error;
    }
  }

  async updateDashboardForm(id: number, dto: UpdateDashboardSurveyFormDto) {
    await this.ensureDashboardFormExists(id);
    try {
      return await this.prisma.dashboardSurveyForm.update({
        where: { id },
        data: {
          ...(dto.code !== undefined && { code: dto.code.trim() }),
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description.trim(),
          }),
          ...(dto.isCdr !== undefined && { isCdr: dto.isCdr }),
          ...(dto.enabled !== undefined && { enabled: dto.enabled }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Mã phiếu Dashboard đã tồn tại.');
      }
      throw error;
    }
  }

  async findDashboardQuestions(dashboardFormId: number) {
    await this.ensureDashboardFormExists(dashboardFormId);
    const questions = await this.prisma.dashboardSurveyQuestion.findMany({
      where: { dashboardFormId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return questions.map(({ options, ...question }) => ({
      ...question,
      options: JSON.parse(options) as string[],
    }));
  }

  async saveDashboardQuestions(
    dashboardFormId: number,
    dto: UpdateSurveyQuestionsDto,
  ) {
    await this.ensureDashboardFormExists(dashboardFormId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.dashboardSurveyQuestion.deleteMany({
        where: { dashboardFormId },
      });
      if (dto.questions.length > 0) {
        await transaction.dashboardSurveyQuestion.createMany({
          data: dto.questions.map((question, index) => ({
            dashboardFormId,
            questionText: question.questionText.trim(),
            type: question.type,
            required: question.required,
            options: JSON.stringify(question.options),
            groupNo: question.groupNo,
            groupTitle: question.groupTitle?.trim() ?? '',
            sortOrder: question.sortOrder ?? index,
          })),
        });
      }
    });

    return this.findDashboardQuestions(dashboardFormId);
  }

  private async ensureDashboardFormExists(id: number) {
    const form = await this.prisma.dashboardSurveyForm.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!form) {
      throw new NotFoundException(
        `Không tìm thấy phiếu Dashboard có ID ${id}`,
      );
    }
  }

  async findQuestions(surveyFormId: number) {
    await this.ensureSurveyExists(surveyFormId);
    const questions = await this.prisma.surveyQuestion.findMany({
      where: { surveyFormId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return questions.map(({ options, ...question }) => ({
      ...question,
      options: JSON.parse(options) as string[],
    }));
  }

  async saveQuestions(
    surveyFormId: number,
    dto: UpdateSurveyQuestionsDto,
  ) {
    await this.ensureSurveyExists(surveyFormId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.surveyQuestion.deleteMany({ where: { surveyFormId } });
      if (dto.questions.length > 0) {
        await transaction.surveyQuestion.createMany({
          data: dto.questions.map((question, index) => ({
            surveyFormId,
            questionText: question.questionText.trim(),
            type: question.type,
            required: question.required,
            options: JSON.stringify(question.options),
            groupNo: question.groupNo,
            groupTitle: question.groupTitle?.trim() ?? '',
            sortOrder: question.sortOrder ?? index,
          })),
        });
      }
    });

    return this.findQuestions(surveyFormId);
  }

  private async ensureSurveyExists(id: number) {
    const survey = await this.prisma.surveyForm.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!survey) {
      throw new NotFoundException(`Không tìm thấy phiếu khảo sát có ID ${id}`);
    }
  }

  async create(dto: CreateSurveyFormDto) {
    try {
      return await this.prisma.surveyForm.create({
        data: {
          year: dto.year.trim(),
          code: dto.code.trim(),
          title: dto.title.trim(),
          description: dto.description?.trim() ?? '',
          isCdr: dto.isCdr ?? false,
          link: dto.link?.trim() ?? '',
          level: dto.level,
          enabled: dto.enabled ?? true,
          legacyLink: dto.legacyLink?.trim() ?? '',
          menu: dto.menu ?? 'main',
          classes: dto.classes?.trim() ?? '',
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Mã phiếu khảo sát đã tồn tại.');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateSurveyFormDto) {
    const survey = await this.prisma.surveyForm.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!survey) {
      throw new NotFoundException(`Không tìm thấy phiếu khảo sát có ID ${id}`);
    }

    try {
      return await this.prisma.surveyForm.update({
        where: { id },
        data: {
          ...(dto.year !== undefined && { year: dto.year.trim() }),
          ...(dto.code !== undefined && { code: dto.code.trim() }),
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description.trim(),
          }),
          ...(dto.isCdr !== undefined && { isCdr: dto.isCdr }),
          ...(dto.link !== undefined && { link: dto.link.trim() }),
          ...(dto.level !== undefined && { level: dto.level }),
          ...(dto.enabled !== undefined && { enabled: dto.enabled }),
          ...(dto.legacyLink !== undefined && {
            legacyLink: dto.legacyLink.trim(),
          }),
          ...(dto.menu !== undefined && { menu: dto.menu }),
          ...(dto.classes !== undefined && { classes: dto.classes.trim() }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Mã phiếu khảo sát đã tồn tại.');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const survey = await this.prisma.surveyForm.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!survey) {
      throw new NotFoundException(`Không tìm thấy phiếu khảo sát có ID ${id}`);
    }

    return this.prisma.surveyForm.delete({ where: { id } });
  }
}
