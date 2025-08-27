# /backend/Dockerfile.dev

# Usar a imagem oficial do Node.js
FROM node:18-alpine

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos de manifesto para que as dependências sejam instaladas
# A pasta node_modules NÃO será copiada, pois será montada como um volume
COPY package*.json ./

# Instalar todas as dependências do projeto
# (incluindo as de desenvolvimento como o nodemon)
RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 5000

# O comando para iniciar a aplicação será definido no docker-compose.yml
# para que possamos usar o nodemon
CMD ["npm", "run", "dev"]
