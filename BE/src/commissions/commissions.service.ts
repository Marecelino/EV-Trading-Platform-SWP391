import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CommissionRule = {
  min?: number;
  max?: number;
  rate: number;
  category?: string;
};

type CommissionContext = {
  amount: number;
  category?: string;
};

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);
  private readonly defaultRate: number;
  private readonly rules: CommissionRule[];

  constructor(private readonly configService: ConfigService) {
    this.defaultRate = this.parseNumberConfig('COMMISSION_DEFAULT_RATE', 0.05);
    this.rules = this.parseRules();
  }

  calculate(context: CommissionContext) {
    const rate = this.resolveRate(context);
    const platformFee = Math.round(context.amount * rate);
    const sellerPayout = Math.max(context.amount - platformFee, 0);

    return { rate, platformFee, sellerPayout };
  }

  private resolveRate(context: CommissionContext) {
    const matchingRule = this.rules.find((rule) => {
      if (rule.category && rule.category !== context.category) {
        return false;
      }
      if (rule.min !== undefined && context.amount < rule.min) {
        return false;
      }
      if (rule.max !== undefined && context.amount > rule.max) {
        return false;
      }
      return true;
    });

    return matchingRule?.rate ?? this.defaultRate;
  }

  private parseRules() {
    const raw = this.configService.get<string>('COMMISSION_RULES_JSON');
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CommissionRule[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.warn(`COMMISSION_RULES_JSON could not be parsed: ${error}`);
      return [];
    }
  }

  private parseNumberConfig(key: string, fallback: number) {
    const raw = this.configService.get<string>(key);
    if (!raw) {
      return fallback;
    }

    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) {
      this.logger.warn(`${key} is invalid, using fallback ${fallback}`);
      return fallback;
    }

    return value;
  }
}
