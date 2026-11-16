import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { SessionUser } from '@futora/types';
import { z } from 'zod';
import { StockIndentStatus } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BranchAccessService } from '../../common/services/branch-access.service';
import { IndentsService } from './indents.service';

const createIndentSchema = z.object({
  sourceBranchId: z.string().min(1),
  targetBranchId: z.string().min(1),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
  notes: z.string().trim().max(300).optional(),
  items: z.array(
    z.object({
      ingredientName: z.string().min(1),
      unit: z.string().min(1),
      requestedQty: z.coerce.number().positive().max(1_000_000),
      notes: z.string().trim().max(200).optional(),
    }),
  ).min(1),
});

const dispatchIndentSchema = z.object({
  dispatchVehicle: z.string().trim().max(50).optional(),
  dispatchNotes: z.string().trim().max(300).optional(),
  items: z.array(
    z.object({
      id: z.string().min(1),
      dispatchedQty: z.coerce.number().min(0).max(1_000_000),
    }),
  ).optional(),
});

const receiveIndentSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      receivedQty: z.coerce.number().min(0).max(1_000_000),
      notes: z.string().trim().max(200).optional(),
    }),
  ).min(1),
});

const rejectIndentSchema = z.object({
  reason: z.string().trim().min(1).max(300),
});

const toggleCentralKitchenSchema = z.object({
  isCentralKitchen: z.boolean(),
});

@ApiTags('inventory')
@Controller('v1/inventory')
export class IndentsController {
  constructor(
    private readonly indents: IndentsService,
    private readonly branchAccess: BranchAccessService,
  ) {}

  @Auth('inventory.manage')
  @Get('central-kitchens')
  async listCentralKitchens(@CurrentUser() u: SessionUser) {
    return this.indents.listCentralKitchens(u.restaurantId);
  }

  @Auth('inventory.manage')
  @Patch('branches/:id/central-kitchen')
  @UsePipes(new ZodValidationPipe(toggleCentralKitchenSchema))
  async toggleCentralKitchen(
    @CurrentUser() u: SessionUser,
    @Param('id') branchId: string,
    @Body() body: z.infer<typeof toggleCentralKitchenSchema>,
  ) {
    await this.branchAccess.assertAccess(u.restaurantId, branchId);
    return this.indents.toggleCentralKitchen(
      u.restaurantId,
      branchId,
      body.isCentralKitchen,
    );
  }

  @Auth('inventory.manage')
  @Get('indents')
  async listIndents(
    @CurrentUser() u: SessionUser,
    @Query('branchId') branchId?: string,
    @Query('status') status?: StockIndentStatus,
  ) {
    if (branchId) {
      await this.branchAccess.assertAccess(u.restaurantId, branchId);
    }
    return this.indents.listIndents(u.restaurantId, { branchId, status });
  }

  @Auth('inventory.manage')
  @Get('indents/:id')
  async getIndent(
    @CurrentUser() u: SessionUser,
    @Param('id') id: string,
  ) {
    return this.indents.getIndent(u.restaurantId, id);
  }

  @Auth('inventory.manage')
  @AuditAction('stock.indent_created', 'StockIndent')
  @Post('indents')
  @UsePipes(new ZodValidationPipe(createIndentSchema))
  async createIndent(
    @CurrentUser() u: SessionUser,
    @Body() body: z.infer<typeof createIndentSchema>,
  ) {
    await this.branchAccess.assertAccess(u.restaurantId, body.sourceBranchId);
    return this.indents.createIndent(
      u.restaurantId,
      u.id,
      u.name,
      body,
    );
  }

  @Auth('inventory.manage')
  @AuditAction('stock.indent_approved', 'StockIndent')
  @Patch('indents/:id/approve')
  async approveIndent(
    @CurrentUser() u: SessionUser,
    @Param('id') id: string,
  ) {
    return this.indents.approveIndent(u.restaurantId, u.id, id);
  }

  @Auth('inventory.manage')
  @AuditAction('stock.indent_dispatched', 'StockIndent')
  @Patch('indents/:id/dispatch')
  @UsePipes(new ZodValidationPipe(dispatchIndentSchema))
  async dispatchIndent(
    @CurrentUser() u: SessionUser,
    @Param('id') id: string,
    @Body() body: z.infer<typeof dispatchIndentSchema>,
  ) {
    return this.indents.dispatchIndent(u.restaurantId, u.id, id, body);
  }

  @Auth('inventory.manage')
  @AuditAction('stock.indent_received', 'StockIndent')
  @Patch('indents/:id/receive')
  @UsePipes(new ZodValidationPipe(receiveIndentSchema))
  async receiveIndent(
    @CurrentUser() u: SessionUser,
    @Param('id') id: string,
    @Body() body: z.infer<typeof receiveIndentSchema>,
  ) {
    return this.indents.receiveIndent(u.restaurantId, u.id, id, body);
  }

  @Auth('inventory.manage')
  @AuditAction('stock.indent_rejected', 'StockIndent')
  @Patch('indents/:id/reject')
  @UsePipes(new ZodValidationPipe(rejectIndentSchema))
  async rejectIndent(
    @CurrentUser() u: SessionUser,
    @Param('id') id: string,
    @Body() body: z.infer<typeof rejectIndentSchema>,
  ) {
    return this.indents.rejectIndent(u.restaurantId, u.id, id, body.reason);
  }
}
