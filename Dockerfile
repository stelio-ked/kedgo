# Estágio 1: Construção da aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies necessárias para compilar)
RUN npm install --no-audit --no-fund --legacy-peer-deps

# Copia o restante do código-fonte
COPY . .

# Compila o Front-end e o Back-end
RUN npm run build

# Estágio 2: Ambiente de execução leve
FROM node:20-alpine AS runner

WORKDIR /app

# Instala o bash para que o console/terminal funcione corretamente no Cloud Run
RUN apk add --no-cache bash

ENV NODE_ENV=production

# Copia definições de dependências
COPY package*.json ./

# Instala apenas as dependências de produção para manter a imagem limpa e rápida
RUN npm install --omit=dev --no-audit --no-fund --legacy-peer-deps

# Copia os arquivos compilados do estágio anterior
COPY --from=builder /app/dist ./dist

# Expõe a porta interna da aplicação (3000)
EXPOSE 3000

# Comando para iniciar o servidor Express compilado
CMD ["npm", "run", "start"]
