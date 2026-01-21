FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy necessary files
COPY --from=deps /app/package.json ./package.json
# Install only production dependencies
COPY --from=deps /app/package-lock.json ./package-lock.json
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Copy the generated client from builder if it's in node_modules, or regenerate if needed. 
# Ideally prisma generate output is in node_modules, which we just wiped.
# So we need to regenerate client in runner or copy node_modules carefully.
# Better strategy: regenerate client in runner to be safe with arch, or copy from builder.
# Copying from builder is faster.
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER expressjs

EXPOSE 5000

CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" = \"true\" ]; then npx prisma migrate deploy; fi; node dist/index.js"]