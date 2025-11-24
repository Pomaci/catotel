import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PaymentStatus, Prisma, PrismaClient } from '@prisma/client';

const paymentProcessedAtExtension = Prisma.defineExtension({
  name: 'paymentProcessedAt',
  query: {
    payment: {
      create({ args, query }) {
        stampData(args.data);
        return query(args);
      },
      createMany({ args, query }) {
        stampMany(args.data);
        return query(args);
      },
      update({ args, query }) {
        stampData(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        stampMany(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        stampData(args.create);
        stampData(args.update);
        return query(args);
      },
    },
  },
});

function stampMany(data: unknown) {
  if (Array.isArray(data)) {
    data.forEach(stampData);
  } else {
    stampData(data);
  }
}

function stampData(data: unknown) {
  if (!data || typeof data !== 'object') {
    return;
  }

  const payload = data as Record<string, unknown>;
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
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const base = new PrismaClient();
    const extended = base.$extends(paymentProcessedAtExtension);
    return extended as unknown as PrismaService;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
