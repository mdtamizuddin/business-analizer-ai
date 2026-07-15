import { Controller, Get, Post, Body, Param, NotFoundException, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuditsService } from './audits.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompaniesService } from '../companies/companies.service';
import { ReportService } from './report.service';
import { CrawlerService } from '../crawler/crawler.service';

@Controller('audits')
@UseGuards(JwtAuthGuard)
export class AuditsController {
  constructor(
    private readonly auditsService: AuditsService,
    private readonly companiesService: CompaniesService,
    private readonly reportService: ReportService,
    private readonly crawlerService: CrawlerService,
  ) {}

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

  @Get(':id/report')
  async report(
    @Param('id') id: string,
    @Query('format') format: 'html' | 'pdf' = 'html',
    @Res() res: Response,
  ) {
    const audit = await this.auditsService.findById(id);
    if (!audit) throw new NotFoundException('Audit not found');

    const company = await this.companiesService.findById(audit.companyId);
    const html = this.reportService.buildHtml({
      companyName: company?.name ?? 'Company',
      website: company?.website ?? '',
      industry: company?.industry,
      scores: audit.scores,
      seoAnalysis: audit.seoAnalysis,
      performanceAnalysis: audit.performanceAnalysis,
      brandingAnalysis: audit.brandingAnalysis,
      executiveSummary: audit.executiveSummary,
      recommendations: audit.recommendations ?? [],
      completedAt: audit.completedAt,
    });

    if (format === 'pdf') {
      const pdf = await this.crawlerService.htmlToPdf(html);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="audit-${id}.pdf"`);
      res.send(pdf);
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="audit-${id}.html"`);
      res.send(html);
    }
  }
}
