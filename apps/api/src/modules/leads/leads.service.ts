import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from './schemas/lead.schema';
import { AddNoteDto, CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
  ) {}

  async create(dto: CreateLeadDto, organizationId: string): Promise<LeadDocument> {
    const created = new this.leadModel({ ...dto, organizationId });
    const saved = await created.save();
    this.logger.log(`Created lead: ${saved.name} (${saved._id})`);
    return saved;
  }

  async findAll(organizationId: string): Promise<LeadDocument[]> {
    return this.leadModel
      .find({ organizationId })
      .sort({ updatedAt: -1 })
      .limit(200)
      .exec();
  }

  async findOne(id: string, organizationId: string): Promise<LeadDocument> {
    const lead = await this.leadModel.findOne({ _id: id, organizationId }).exec();
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, organizationId: string): Promise<LeadDocument> {
    const lead = await this.leadModel
      .findOneAndUpdate({ _id: id, organizationId }, dto, { new: true })
      .exec();
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async addNote(id: string, dto: AddNoteDto, organizationId: string): Promise<LeadDocument> {
    const lead = await this.leadModel
      .findOneAndUpdate(
        { _id: id, organizationId },
        { $push: { notes: { note: dto.note, createdAt: new Date() } } },
        { new: true },
      )
      .exec();
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async remove(id: string, organizationId: string): Promise<{ deleted: boolean }> {
    const res = await this.leadModel.deleteOne({ _id: id, organizationId }).exec();
    return { deleted: res.deletedCount === 1 };
  }
}
