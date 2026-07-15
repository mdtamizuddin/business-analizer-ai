import { Module } from '@nestjs/common';
import { TechnologyService } from './technology.service';

@Module({
  providers: [TechnologyService],
  exports: [TechnologyService],
})
export class TechnologyModule {}
