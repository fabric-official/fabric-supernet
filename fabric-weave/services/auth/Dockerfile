FROM node:22-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm ci --omit=dev
COPY src ./src
RUN npm run build && npm prune --omit=dev
EXPOSE 8787
CMD ["node", "dist/server.js"]
