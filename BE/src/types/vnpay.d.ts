declare module 'vnpay/vnpay' {
  export interface VNPayConfig {
    tmnCode: string;
    secureSecret: string;
    vnpayHost: string;
    testMode?: boolean;
    endpoints?: {
      paymentEndpoint?: string;
    };
  }

  export interface VerifyResult<T = any> {
    isSuccess: boolean;
    message?: string;
    data?: T;
  }

  export class VNPay {
    constructor(config: VNPayConfig);
    buildPaymentUrl(params: Record<string, any>): string;
    verifyReturnUrl<T = any>(params: T): VerifyResult<T>;
  }
}

declare module 'vnpay/enums' {
  export enum ProductCode {
    Other = 'other',
  }

  export enum VnpLocale {
    VN = 'vn',
    EN = 'en',
  }
}

declare module 'vnpay/utils' {
  export function dateFormat(date: Date): string;
}
