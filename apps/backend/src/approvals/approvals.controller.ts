import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  requestApprovalSchema,
  type RequestApprovalDto,
  type SessionUser,
} from '@futora/types';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ApprovalsService } from './approvals.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Approvals')
@Controller('v1/approvals')
export class ApprovalsController {
  constructor(
    private readonly approvals: ApprovalsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('request')
  @Auth('order.create')
  @UsePipes(new ZodValidationPipe(requestApprovalSchema))
  requestApproval(
    @CurrentUser() user: SessionUser,
    @Body() dto: RequestApprovalDto,
  ) {
    return this.approvals.requestApproval({
      restaurantId: user.restaurantId,
      requesterId: user.id,
      dto,
    });
  }

  @Get('logs')
  @Auth('reports.view_basic')
  listLogs(@CurrentUser() user: SessionUser) {
    return this.prisma.approvalLog.findMany({
      where: { restaurantId: user.restaurantId },
      include: {
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        device: { select: { id: true, label: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
