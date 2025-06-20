# Estágio 1: Build - Instala dependências e prepara os arquivos
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app .

EXPOSE 4000

CMD ["node", "index.js"]