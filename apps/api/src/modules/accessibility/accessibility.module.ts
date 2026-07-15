import { Module } from '@nestjs/common';
import { AccessibilityService } from './accessibility.service';

@Module({
  providers: [AccessibilityService],
  exports: [AccessibilityService],
})
export class AccessibilityModule {}
