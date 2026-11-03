import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.program.findMany({
      include: {
        majors: {
          select: {
            id: true,
            code: true,
            name: true,
            _count: { select: { courses: true, plos: true, clos: true } },
          },
          orderBy: { code: 'asc' },
        },
        _count: { select: { majors: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.program.findUnique({
      where: { id },
      include: {
        majors: {
          include: {
            courses: true,
            plos: true,
            clos: true,
          },
          orderBy: { code: 'asc' },
        },
      },
    });
  }

  async getExportData(id: number) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, description: true },
    });
    if (!program) throw new NotFoundException('Không tìm thấy chương trình đào tạo.');

    const majors = await this.prisma.major.findMany({
      where: { programId: id },
      include: { courses: true, plos: true, clos: true, assessments: { select: { ploRate: true } } },
      orderBy: { code: 'asc' },
    });
    const analysisSetting = await this.prisma.analysisSetting.findUnique({ where: { id: 1 }, select: { ploThreshold: true } });
    const attainmentThreshold = analysisSetting?.ploThreshold || 75;
    const majorIds = majors.map((major) => major.id);
    const matrices = majorIds.length === 0
      ? []
      : await this.prisma.matrix.findMany({
        where: { clo: { majorId: { in: majorIds } } },
        include: {
          clo: { select: { code: true, majorId: true } },
          plo: { select: { code: true, majorId: true } },
          course: { select: { code: true } },
        },
        orderBy: { id: 'asc' },
      });

    return {
      program,
      evaluation: {
        threshold: attainmentThreshold,
        status: majors.length === 0 || majors.some((major) => major.assessments.length === 0)
          ? 'Chưa có dữ liệu'
          : majors.every((major) => major.assessments.reduce((sum, item) => sum + item.ploRate, 0) / major.assessments.length >= attainmentThreshold) ? 'Đạt' : 'Chưa đạt',
      },
      majors: majors.map(({ id: majorId, code, name, description, assessments }) => ({
        id: majorId,
        code,
        name,
        description,
        evaluation: {
          averagePloRate: assessments.length ? Number((assessments.reduce((sum, item) => sum + item.ploRate, 0) / assessments.length).toFixed(2)) : null,
          threshold: attainmentThreshold,
          status: assessments.length ? (assessments.reduce((sum, item) => sum + item.ploRate, 0) / assessments.length >= attainmentThreshold ? 'Đạt' : 'Chưa đạt') : 'Chưa có dữ liệu',
        },
        courses: majors.find((major) => major.id === majorId)?.courses ?? [],
        plos: majors.find((major) => major.id === majorId)?.plos ?? [],
        clos: majors.find((major) => major.id === majorId)?.clos ?? [],
      })),
      matrices: matrices.map((matrix) => ({
        majorCode: majors.find((major) => major.id === matrix.clo.majorId)?.code ?? '',
        courseCode: matrix.course?.code ?? '',
        cloCode: matrix.clo.code,
        ploCode: matrix.plo.code,
        level: matrix.level,
        method: matrix.method,
      })),
    };
  }

  async create(data: { code: string; name: string; description?: string; majorCode: string; majorName: string; majorDescription?: string }) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const program = await transaction.program.create({
          data: {
            code: data.code.trim().toUpperCase(),
            name: data.name.trim(),
            description: data.description?.trim() || null,
          },
        });
        await transaction.major.create({
          data: {
            code: data.majorCode.trim().toUpperCase(),
            name: data.majorName.trim(),
            description: data.majorDescription?.trim() || null,
            programId: program.id,
          },
        });
        return transaction.program.findUnique({ where: { id: program.id }, include: { majors: true } });
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Mã CTĐT hoặc mã ngành đã tồn tại.');
      }
      throw error;
    }
  }

  async import(data: {
    ctdt: { MaCTDT: string; TenCTDT: string; MoTa?: string };
    nganh: Array<{ MaNganh: string; TenNganh: string; MoTa?: string }>;
    hocphan: Array<{ MaNganh: string; MaHocPhan: string; TenHocPhan: string; SoTinChi: number; HocKy?: number | string; MaHocPhanThayThe?: string; TenHocPhanThayThe?: string }>;
    plo: Array<{ MaNganh: string; MaPLO: string; MoTaPLO: string; NguongDat?: number | string; MaPLOCha?: string }>;
    clo: Array<{ MaNganh: string; MaHocPhan: string; MaCLO: string; MoTaCLO: string }>;
    matrix: Array<{ MaNganh: string; MaHocPhan: string; MaCLO: string; MaPLO: string; MucDongGop: number | string; PhuongPhap: string }>;
  }) {
    const clean = (value: unknown) => String(value ?? '').trim();
    const levelToNumber = (value: unknown) => {
      const normalized = clean(value).toUpperCase();
      if (normalized === 'I' || normalized === '1') return 1;
      if (normalized === 'R' || normalized === '2') return 2;
      if (normalized === 'M' || normalized === '3') return 3;
      throw new ConflictException(`Mức đóng góp không hợp lệ: ${normalized}`);
    };
    const programCode = clean(data.ctdt?.MaCTDT).toUpperCase();
    if (!programCode || !clean(data.ctdt?.TenCTDT)) throw new ConflictException('Thiếu thông tin CTĐT để nhập.');
    if (!data.nganh?.length) throw new ConflictException('File phải có ít nhất một ngành đào tạo.');

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const program = await transaction.program.upsert({
          where: { code: programCode },
          create: { code: programCode, name: clean(data.ctdt.TenCTDT), description: clean(data.ctdt.MoTa) || null },
          update: { name: clean(data.ctdt.TenCTDT), description: clean(data.ctdt.MoTa) || null },
        });
        const majorIds = new Map<string, number>();
        for (const row of data.nganh) {
          const code = clean(row.MaNganh).toUpperCase();
          if (!code || !clean(row.TenNganh)) throw new ConflictException('Ngành phải có mã và tên.');
          const existing = await transaction.major.findUnique({ where: { code }, select: { id: true, programId: true } });
          if (existing?.programId && existing.programId !== program.id) throw new ConflictException(`Ngành ${code} đang thuộc CTĐT khác.`);
          const major = existing
            ? await transaction.major.update({ where: { id: existing.id }, data: { name: clean(row.TenNganh), description: clean(row.MoTa) || null, programId: program.id } })
            : await transaction.major.create({ data: { code, name: clean(row.TenNganh), description: clean(row.MoTa) || null, programId: program.id } });
          majorIds.set(code, major.id);
        }

        const courseIds = new Map<string, number>();
        for (const row of data.hocphan || []) {
          const majorId = majorIds.get(clean(row.MaNganh).toUpperCase());
          if (!majorId) throw new ConflictException(`Không tìm thấy ngành ${clean(row.MaNganh)} của học phần.`);
          const code = clean(row.MaHocPhan).toUpperCase();
          const existing = await transaction.course.findUnique({ where: { code }, select: { id: true, majorId: true } });
          if (existing && existing.majorId !== majorId) throw new ConflictException(`Học phần ${code} đang thuộc ngành khác.`);
          const course = existing
            ? await transaction.course.update({ where: { id: existing.id }, data: { name: clean(row.TenHocPhan), credits: Number(row.SoTinChi), semester: row.HocKy === '' || row.HocKy == null ? null : Number(row.HocKy), replacementCode: clean(row.MaHocPhanThayThe) || null, replacementName: clean(row.TenHocPhanThayThe) || null } })
            : await transaction.course.create({ data: { code, name: clean(row.TenHocPhan), credits: Number(row.SoTinChi), semester: row.HocKy === '' || row.HocKy == null ? null : Number(row.HocKy), replacementCode: clean(row.MaHocPhanThayThe) || null, replacementName: clean(row.TenHocPhanThayThe) || null, majorId } });
          courseIds.set(`${majorId}:${code}`, course.id);
        }

        const ploIds = new Map<string, number>();
        for (const row of data.plo || []) {
          const majorId = majorIds.get(clean(row.MaNganh).toUpperCase());
          if (!majorId) throw new ConflictException(`Không tìm thấy ngành ${clean(row.MaNganh)} của PLO.`);
          const code = clean(row.MaPLO).toUpperCase();
          const existing = await transaction.pLO.findFirst({ where: { majorId, code } });
          const payload = { description: clean(row.MoTaPLO), targetPercent: row.NguongDat === '' || row.NguongDat == null ? null : Number(row.NguongDat) };
          const plo = existing ? await transaction.pLO.update({ where: { id: existing.id }, data: payload }) : await transaction.pLO.create({ data: { code, majorId, ...payload } });
          ploIds.set(`${majorId}:${code}`, plo.id);
        }
        for (const row of data.plo || []) {
          const majorId = majorIds.get(clean(row.MaNganh).toUpperCase());
          const ploId = ploIds.get(`${majorId}:${clean(row.MaPLO).toUpperCase()}`);
          const parentCode = clean(row.MaPLOCha).toUpperCase();
          if (ploId && parentCode) await transaction.pLO.update({ where: { id: ploId }, data: { parentId: ploIds.get(`${majorId}:${parentCode}`) || null } });
        }

        const cloIds = new Map<string, number>();
        for (const row of data.clo || []) {
          const majorId = majorIds.get(clean(row.MaNganh).toUpperCase());
          if (!majorId) throw new ConflictException(`Không tìm thấy ngành ${clean(row.MaNganh)} của CLO.`);
          const courseId = courseIds.get(`${majorId}:${clean(row.MaHocPhan).toUpperCase()}`);
          if (!courseId) throw new ConflictException(`Không tìm thấy học phần ${clean(row.MaHocPhan)} của CLO.`);
          const code = clean(row.MaCLO).toUpperCase();
          const existing = await transaction.cLO.findFirst({ where: { majorId, code } });
          const clo = existing ? await transaction.cLO.update({ where: { id: existing.id }, data: { description: clean(row.MoTaCLO) } }) : await transaction.cLO.create({ data: { code, description: clean(row.MoTaCLO), majorId } });
          cloIds.set(`${majorId}:${courseId}:${code}`, clo.id);
          await transaction.courseCLO.upsert({ where: { courseId_cloId: { courseId, cloId: clo.id } }, create: { courseId, cloId: clo.id }, update: {} });
        }
        for (const row of data.matrix || []) {
          const majorId = majorIds.get(clean(row.MaNganh).toUpperCase());
          const courseId = courseIds.get(`${majorId}:${clean(row.MaHocPhan).toUpperCase()}`);
          const cloId = cloIds.get(`${majorId}:${courseId}:${clean(row.MaCLO).toUpperCase()}`);
          const ploId = ploIds.get(`${majorId}:${clean(row.MaPLO).toUpperCase()}`);
          if (!courseId || !cloId || !ploId) throw new ConflictException(`Ma trận có mã liên kết không tồn tại ở dòng ${JSON.stringify(row)}.`);
          const existing = await transaction.matrix.findFirst({ where: { courseId, cloId, ploId } });
          const matrixData = { courseId, cloId, ploId, level: levelToNumber(row.MucDongGop), method: clean(row.PhuongPhap).toUpperCase() || 'TT' };
          if (existing) await transaction.matrix.update({ where: { id: existing.id }, data: matrixData });
          else await transaction.matrix.create({ data: matrixData });
        }
        return { programId: program.id, imported: { majors: data.nganh.length, courses: data.hocphan?.length || 0, plos: data.plo?.length || 0, clos: data.clo?.length || 0, matrices: data.matrix?.length || 0 } };
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Dữ liệu bị trùng mã trong file CTĐT.');
      throw error;
    }
  }

  async update(id: number, data: { code?: string; name?: string; description?: string }) {
    const exists = await this.prisma.program.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Không tìm thấy chương trình đào tạo.');

    try {
      return await this.prisma.program.update({
        where: { id },
        data: {
          ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
        },
        include: { majors: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Mã chương trình đào tạo đã tồn tại.');
      }
      throw error;
    }
  }

  async addMajor(id: number, data: { code: string; name: string; description?: string }) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Không tìm thấy CTĐT.');
    const code = data.code.trim().toUpperCase();
    const existing = await this.prisma.major.findUnique({ where: { code } });
    if (existing?.programId && existing.programId !== id) {
      throw new ConflictException('Ngành này đã thuộc một CTĐT khác.');
    }
    try {
      const major = existing
        ? await this.prisma.major.update({ where: { id: existing.id }, data: { name: data.name.trim(), description: data.description?.trim() || null, programId: id } })
        : await this.prisma.major.create({ data: { code, name: data.name.trim(), description: data.description?.trim() || null, programId: id } });
      return { programId: id, major };
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Mã ngành đã tồn tại.');
      throw error;
    }
  }

  async remove(id: number) {
    const exists = await this.prisma.program.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Không tìm thấy chương trình đào tạo.');

    const majorCount = await this.prisma.major.count({ where: { programId: id } });
    if (majorCount > 0) {
      throw new ConflictException('Không thể xóa chương trình đang có ngành đào tạo.');
    }

    return this.prisma.program.delete({ where: { id } });
  }
}
