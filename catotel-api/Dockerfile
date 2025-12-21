# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY catotel-api ./catotel-api
COPY catotel-clients ./catotel-clients
RUN pnpm install --filter catotel-api... --frozen-lockfile

FROM deps AS build
RUN pnpm --filter catotel-api... prisma generate
RUN pnpm --filter catotel-api... build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /workspace/catotel-clients ./catotel-clients
COPY --from=build /workspace/catotel-api/dist ./catotel-api/dist
COPY --from=build /workspace/catotel-api/prisma ./catotel-api/prisma
COPY --from=build /workspace/catotel-api/package.json ./catotel-api/package.json
EXPOSE 3000
CMD ["sh","-c","pnpm --filter catotel-api prisma migrate deploy && pnpm --filter catotel-api start:prod"]
