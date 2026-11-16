import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { BranchAccessService } from '../../common/services/branch-access.service';
import { GoodsReceiptsService } from './goods-receipts.service';
import { IndentsController } from './indents.controller';
import { IndentsService } from './indents.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseRequestsService } from './purchase-requests.service';
import { StockService } from './stock.service';
import { SupplierInvoicesService } from './supplier-invoices.service';
import { SupplierQuotationsService } from './supplier-quotations.service';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { WasteService } from './waste.service';

@Module({
  imports: [AuditModule],
  controllers: [InventoryController, TransfersController, IndentsController],
  providers: [
    InventoryService,
    PurchaseOrdersService,
    GoodsReceiptsService,
    WasteService,
    StockService,
    TransfersService,
    IndentsService,
    PurchaseRequestsService,
    SupplierQuotationsService,
    SupplierInvoicesService,
    BranchAccessService,
  ],
  exports: [InventoryService, IndentsService],
})
export class InventoryModule {}
