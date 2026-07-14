import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { AuditsService } from './audits.service';
import { CreateAuditDto } from './dto/create-audit.dto';

@Controller('audits')
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Post()
  async create(@Body() dto: CreateAuditDto) {
    return this.auditsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.auditsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const audit = await this.auditsService.findById(id);
    if (!audit) throw new NotFoundException('Audit not found');
    return audit;
  }

  @Get('company/:companyId')
  async findByCompany(@Param('companyId') companyId: string) {
    return this.auditsService.findByCompany(companyId);
  }
}
