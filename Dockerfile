# Dockerfile para CellSync
FROM node:22-alpine

# Instalar pnpm
RUN npm install -g pnpm

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar todo o código
COPY . .

# Build da aplicação
RUN pnpm build

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["pnpm", "start"]
