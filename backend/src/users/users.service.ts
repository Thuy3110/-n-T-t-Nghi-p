import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, username: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  updateRole(userId: number, role: 'USER' | 'LECTURER') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, fullName: true, username: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  getProfile(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true, phone: true, username: true, email: true, role: true, createdAt: true } });
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    try {
      return await this.prisma.user.update({ where: { id: userId }, data: { fullName: dto.fullName.trim(), phone: dto.phone?.trim() || null, email: dto.email?.trim() || null }, select: { id: true, fullName: true, phone: true, username: true, email: true, role: true, createdAt: true } });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Email đã được sử dụng.');
      throw error;
    }
  }

  getPreferences(userId: number) { return this.prisma.userPreference.upsert({ where: { userId }, create: { userId }, update: {} }); }

  updatePreferences(userId: number, dto: UpdatePreferenceDto) { return this.prisma.userPreference.upsert({ where: { userId }, create: { userId, ...dto }, update: dto }); }

  listTasks(userId: number) { return this.prisma.workTask.findMany({ where: { userId }, orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }] }); }

  createTask(userId: number, dto: CreateTaskDto) {
    return this.prisma.workTask.create({ data: { userId, title: dto.title.trim(), description: dto.description?.trim() ?? '', dueDate: dto.dueDate ? new Date(dto.dueDate) : null, priority: dto.priority ?? 'MEDIUM' } });
  }

  async updateTask(userId: number, id: number, dto: UpdateTaskDto) {
    await this.ensureTask(userId, id);
    return this.prisma.workTask.update({ where: { id }, data: { ...dto, title: dto.title?.trim(), description: dto.description?.trim(), dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null } });
  }

  async removeTask(userId: number, id: number) {
    await this.ensureTask(userId, id);
    return this.prisma.workTask.delete({ where: { id } });
  }

  private async ensureTask(userId: number, id: number) {
    const task = await this.prisma.workTask.findFirst({ where: { id, userId }, select: { id: true } });
    if (!task) throw new NotFoundException('Không tìm thấy công việc.');
  }
}
