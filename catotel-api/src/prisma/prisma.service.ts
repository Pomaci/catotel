import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PaymentStatus, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
    this.$use(async (params, next) => {
      if (params.model !== 'Payment' || !params.args?.data) {
        return next(params);
      }

      const stampProcessedAt = (payload: Record<string, unknown>) => {
        const status = payload.status as PaymentStatus | undefined;
        if (!status) {
          return;
        }

        if (
          status === PaymentStatus.PAID ||
          status === PaymentStatus.FAILED ||
          status === PaymentStatus.REFUNDED
        ) {
          if (payload.processedAt === undefined) {
            payload.processedAt = new Date();
          }
        } else if (status === PaymentStatus.PENDING) {
          payload.processedAt = null;
        }
      };

      const { action, args } = params;

      if (action === 'create' || action === 'update' || action === 'updateMany') {
        stampProcessedAt(args.data as Record<string, unknown>);
      } else if (action === 'createMany') {
        const data = args.data as Record<string, unknown> | Record<string, unknown>[];
        if (Array.isArray(data)) {
          data.forEach(stampProcessedAt);
        } else {
          stampProcessedAt(data);
        }
      } else if (action === 'upsert') {
        if (args.data?.create) {
          stampProcessedAt(args.data.create as Record<string, unknown>);
        }
        if (args.data?.update) {
          stampProcessedAt(args.data.update as Record<string, unknown>);
        }
      }

      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
