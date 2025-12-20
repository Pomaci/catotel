# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY catotel-dashboard ./catotel-dashboard
COPY catotel-clients ./catotel-clients
RUN pnpm install --filter catotel-dashboard... --frozen-lockfile

FROM deps AS build
RUN pnpm --filter catotel-dashboard... build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /workspace/catotel-clients ./catotel-clients
COPY --from=build /workspace/catotel-dashboard ./catotel-dashboard
EXPOSE 3100
CMD ["pnpm","--filter","catotel-dashboard","start"]
