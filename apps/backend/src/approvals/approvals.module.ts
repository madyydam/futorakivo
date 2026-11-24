import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { ApprovalGuard } from '../common/guards/approval.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalGuard],
  exports: [ApprovalsService, ApprovalGuard],
})
export class ApprovalsModule {}
