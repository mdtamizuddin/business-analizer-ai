import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
  ) {}

  async create(dto: CreateCompanyDto, organizationId = 'default-org'): Promise<CompanyDocument> {
    const created = new this.companyModel({
      ...dto,
      organizationId,
    });
    const saved = await created.save();
    this.logger.log(`Created company: ${saved.name} (${saved._id})`);
    return saved;
  }

  async findById(id: string): Promise<CompanyDocument | null> {
    return this.companyModel.findById(id).exec();
  }

  async findAll(): Promise<CompanyDocument[]> {
    return this.companyModel.find().sort({ createdAt: -1 }).limit(100).exec();
  }

  async findByWebsite(website: string): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ website }).exec();
  }
}
