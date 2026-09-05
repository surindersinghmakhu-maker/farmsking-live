import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY, FeatureRequirement } from '../decorators/require-feature.decorator';
import { AppSettingsService } from '../../modules/app-settings/app-settings.service';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly appSettingsService: AppSettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<FeatureRequirement>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true; // No feature flag requirement on this route
    }

    const { category, subCategory } = requirement;
    const featureFlags = await this.appSettingsService.getFeatureFlags();

    const catObj = featureFlags[category];
    if (!catObj || catObj.enabled === false) {
      throw new ForbiddenException(
        `ਇਹ Category (${category}) ਐਡਮਿਨ ਦੁਆਰਾ ਫਿਲਹਾਲ ਬੰਦ ਕੀਤੀ ਗਈ ਹੈ।`,
      );
    }

    if (subCategory && catObj.subCategories) {
      const subObj = catObj.subCategories[subCategory];
      if (subObj && subObj.enabled === false) {
        throw new ForbiddenException(
          `ਇਹ ਸੁਵਿਧਾ (${subCategory}) ਐਡਮਿਨ ਦੁਆਰਾ ਫਿਲਹਾਲ ਬੰਦ ਕੀਤੀ ਗਈ ਹੈ।`,
        );
      }
    }

    return true;
  }
}
