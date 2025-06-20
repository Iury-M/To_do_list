# Estágio 1: Build - Instala dependências e prepara os arquivos
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

# Estágio 2: Produção
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app .

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]