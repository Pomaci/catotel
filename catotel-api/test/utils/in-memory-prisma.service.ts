import { randomUUID } from 'crypto';

type UserRecord = {
  id: string;
  email: string;
  password: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
};

type SessionRecord = {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  isRevoked: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
};

type DateFilter = { gt?: Date; lt?: Date };

type SessionWhereInput = {
  userId?: string;
  isRevoked?: boolean;
  expiresAt?: DateFilter;
  id?: string | { in: string[] };
  OR?: SessionWhereInput[];
};

type SessionOrderBy =
  | { createdAt: 'asc' | 'desc' }
  | { lastUsedAt: 'asc' | 'desc' };

type SessionSelect = Partial<Record<keyof SessionRecord, boolean>>;

export class InMemoryPrismaService {
  private users = new Map<string, UserRecord>();
  private sessions = new Map<string, SessionRecord>();

  get user() {
    return {
      findUnique: this.findUserUnique,
      create: this.createUser,
    };
  }

  get session() {
    return {
      findMany: this.findSessionMany,
      create: this.createSession,
      update: this.updateSession,
      updateMany: this.updateManySessions,
      deleteMany: this.deleteManySessions,
      findUnique: this.findSessionUnique,
    };
  }

  $transaction = async <T>(
    cb: (tx: { session: typeof this.session }) => Promise<T> | T,
  ): Promise<T> => cb({ session: this.session });

  private findUserUnique = ({
    where,
  }: {
    where: { email?: string; id?: string };
  }): Promise<UserRecord | null> => {
    if (where.email) {
      const match =
        [...this.users.values()].find((user) => user.email === where.email) ??
        null;
      return Promise.resolve(match);
    }
    if (where.id) {
      return Promise.resolve(this.users.get(where.id) ?? null);
    }
    return Promise.resolve(null);
  };

  private createUser = ({
    data,
  }: {
    data: { email: string; password: string; name?: string };
  }): Promise<UserRecord> => {
    const now = new Date();
    const user: UserRecord = {
      id: randomUUID(),
      email: data.email,
      password: data.password,
      name: data.name,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  };

  private findSessionUnique = ({
    where,
  }: {
    where: { id: string };
  }): Promise<SessionRecord | null> =>
    Promise.resolve(this.sessions.get(where.id) ?? null);

  private findSessionMany = ({
    where,
    orderBy,
    select,
  }: {
    where?: SessionWhereInput;
    orderBy?: SessionOrderBy;
    select?: SessionSelect;
  } = {}): Promise<unknown[]> => {
    let result = [...this.sessions.values()].filter((session) =>
      this.matchesSessionWhere(session, where),
    );

    if (orderBy) {
      const [key, direction] = Object.entries(orderBy)[0] as [
        keyof SessionRecord,
        'asc' | 'desc',
      ];
      result = result.sort((a, b) => {
        const diff = (a[key] as Date).getTime() - (b[key] as Date).getTime();
        return direction === 'asc' ? diff : -diff;
      });
    }

    const projected = result.map((session) =>
      select ? this.applySelect(session, select) : session,
    );
    return Promise.resolve(projected);
  };

  private createSession = ({
    data,
  }: {
    data: Omit<
      SessionRecord,
      'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'
    > & {
      lastUsedAt?: Date;
    };
  }): Promise<SessionRecord> => {
    const now = new Date();
    const session: SessionRecord = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      lastUsedAt: data.lastUsedAt ?? now,
      userId: data.userId,
      refreshToken: data.refreshToken,
      userAgent: data.userAgent,
      ip: data.ip,
      isRevoked: data.isRevoked ?? false,
      expiresAt: data.expiresAt,
    };
    this.sessions.set(session.id, session);
    return Promise.resolve(session);
  };

  private updateSession = ({
    where,
    data,
  }: {
    where: { id: string };
    data: Partial<SessionRecord>;
  }): Promise<SessionRecord> => {
    const existing = this.sessions.get(where.id);
    if (!existing) {
      throw new Error('Session not found');
    }
    const updated: SessionRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.sessions.set(updated.id, updated);
    return Promise.resolve(updated);
  };

  private updateManySessions = ({
    where,
    data,
  }: {
    where?: SessionWhereInput & { id?: { in: string[] } };
    data: Partial<SessionRecord>;
  }): Promise<{ count: number }> => {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (this.matchesSessionWhere(session, where)) {
        const updated: SessionRecord = {
          ...session,
          ...data,
          updatedAt: new Date(),
        };
        this.sessions.set(updated.id, updated);
        count += 1;
      }
    }
    return Promise.resolve({ count });
  };

  private deleteManySessions = ({
    where,
  }: {
    where?: SessionWhereInput;
  }): Promise<{ count: number }> => {
    let count = 0;
    for (const session of [...this.sessions.values()]) {
      if (this.matchesSessionWhere(session, where)) {
        this.sessions.delete(session.id);
        count += 1;
      }
    }
    return Promise.resolve({ count });
  };

  private matchesSessionWhere(
    session: SessionRecord,
    where?: SessionWhereInput,
  ) {
    if (!where) return true;
    if (where.OR?.length) {
      return where.OR.some((clause) =>
        this.matchesSessionWhere(session, clause),
      );
    }
    if (
      where.id &&
      typeof where.id !== 'string' &&
      where.id.in &&
      !where.id.in.includes(session.id)
    ) {
      return false;
    }
    if (typeof where.id === 'string' && where.id !== session.id) {
      return false;
    }
    if (where.userId && session.userId !== where.userId) {
      return false;
    }
    if (
      typeof where.isRevoked === 'boolean' &&
      session.isRevoked !== where.isRevoked
    ) {
      return false;
    }
    if (where.expiresAt) {
      if (where.expiresAt.gt && !(session.expiresAt > where.expiresAt.gt)) {
        return false;
      }
      if (where.expiresAt.lt && !(session.expiresAt < where.expiresAt.lt)) {
        return false;
      }
    }
    return true;
  }

  private applySelect(
    session: SessionRecord,
    select: SessionSelect,
  ): Partial<SessionRecord> {
    const projection: Partial<SessionRecord> = {};
    for (const [key, value] of Object.entries(select)) {
      if (value) {
        (projection as Record<string, unknown>)[key] =
          session[key as keyof SessionRecord];
      }
    }
    return projection;
  }
}
