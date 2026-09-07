FROM node:22-alpine AS build
WORKDIR /source
COPY . .
RUN node scripts/build.cjs

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 STATIC_ROOT=/app/public
COPY --from=build /source/dist ./public
COPY server.cjs ./server.cjs
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","server.cjs"]
