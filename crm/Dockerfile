FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta padrão do Next.js
EXPOSE 3000

# Executa em modo de desenvolvimento
CMD ["npm", "run", "dev"]
