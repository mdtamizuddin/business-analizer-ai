import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Audit, AuditDocument } from './schemas/audit.schema';
import { CreateAuditDto } from './dto/create-audit.dto';
import { CompaniesService } from '../companies/companies.service';
import { CRAWL_DEFAULTS } from '@abap/constants';

@Injectable()
export class AuditsService {
  private readonly logger = new Logger(AuditsService.name);

  constructor(
    @InjectModel(Audit.name) private readonly auditModel: Model<AuditDocument>,
    @InjectQueue('audit-queue') private readonly auditQueue: Queue,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(dto: CreateAuditDto): Promise<AuditDocument> {
    const company = await this.companiesService.findById(dto.companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const audit = new this.auditModel({
      companyId: dto.companyId,
      organizationId: company.organizationId,
      status: 'pending',
      startedAt: new Date(),
      auditOptions: {
        crawlDepth: dto.crawlDepth ?? CRAWL_DEFAULTS.MAX_PAGES,
        runSeoAudit: dto.runSeoAudit ?? true,
        runPerformanceAudit: dto.runPerformanceAudit ?? true,
        runBrandingAudit: dto.runBrandingAudit ?? true,
        runAiProcessing: dto.runAiProcessing ?? true,
      },
    });
    const saved = await audit.save();

    await this.auditQueue.add('audit', {
      auditId: (saved._id as any).toString(),
      companyId: dto.companyId,
      crawlDepth: dto.crawlDepth,
      runSeoAudit: dto.runSeoAudit,
      runPerformanceAudit: dto.runPerformanceAudit,
      runBrandingAudit: dto.runBrandingAudit,
      runAiProcessing: dto.runAiProcessing,
    });

    this.logger.log(`Created audit ${saved._id} for company ${dto.companyId}, queued for processing`);
    return saved;
  }

  async findById(id: string): Promise<AuditDocument | null> {
    return this.auditModel.findById(id).exec();
  }

  async findByCompany(companyId: string): Promise<AuditDocument[]> {
    return this.auditModel.find({ companyId }).sort({ createdAt: -1 }).exec();
  }

  async findAll(): Promise<AuditDocument[]> {
    return this.auditModel.find().sort({ createdAt: -1 }).limit(50).exec();
  }
}
