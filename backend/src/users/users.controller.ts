import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get() @UseGuards(AdminRoleGuard) listUsers() { return this.usersService.listUsers(); }
  @Patch(':id/role') @UseGuards(AdminRoleGuard) updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) { return this.usersService.updateRole(id, dto.role); }
  @Get('me') getProfile(@Request() req: { user: { sub: number } }) { return this.usersService.getProfile(req.user.sub); }
  @Patch('me') updateProfile(@Request() req: { user: { sub: number } }, @Body() dto: UpdateProfileDto) { return this.usersService.updateProfile(req.user.sub, dto); }
  @Get('me/preferences') getPreferences(@Request() req: { user: { sub: number } }) { return this.usersService.getPreferences(req.user.sub); }
  @Patch('me/preferences') updatePreferences(@Request() req: { user: { sub: number } }, @Body() dto: UpdatePreferenceDto) { return this.usersService.updatePreferences(req.user.sub, dto); }
  @Get('me/tasks') listTasks(@Request() req: { user: { sub: number } }) { return this.usersService.listTasks(req.user.sub); }
  @Post('me/tasks') createTask(@Request() req: { user: { sub: number } }, @Body() dto: CreateTaskDto) { return this.usersService.createTask(req.user.sub, dto); }
  @Patch('me/tasks/:id') updateTask(@Request() req: { user: { sub: number } }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) { return this.usersService.updateTask(req.user.sub, id, dto); }
  @Delete('me/tasks/:id') removeTask(@Request() req: { user: { sub: number } }, @Param('id', ParseIntPipe) id: number) { return this.usersService.removeTask(req.user.sub, id); }
}
