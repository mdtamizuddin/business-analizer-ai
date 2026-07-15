import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AddNoteDto, CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async create(@Body() dto: CreateLeadDto, @Req() req: any) {
    return this.leadsService.create(dto, req.user.organizationId);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.leadsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.leadsService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto, @Req() req: any) {
    return this.leadsService.update(id, dto, req.user.organizationId);
  }

  @Post(':id/notes')
  async addNote(@Param('id') id: string, @Body() dto: AddNoteDto, @Req() req: any) {
    return this.leadsService.addNote(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.leadsService.remove(id, req.user.organizationId);
  }
}
