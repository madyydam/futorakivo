import { Global, Module } from '@nestjs/common';
import { PermissionsSyncService } from './permissions-sync.service';
import { PermissionsCacheService } from './permissions-cache.service';

@Global()
@Module({
  providers: [PermissionsSyncService, PermissionsCacheService],
  exports: [PermissionsSyncService, PermissionsCacheService],
})
export class PermissionsModule {}
