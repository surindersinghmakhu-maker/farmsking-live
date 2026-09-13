import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppSettingsService } from '../../modules/app-settings/app-settings.service';
export declare class FeatureFlagGuard implements CanActivate {
    private readonly reflector;
    private readonly appSettingsService;
    constructor(reflector: Reflector, appSettingsService: AppSettingsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
