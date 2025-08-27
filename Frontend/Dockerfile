# /frontend/Dockerfile.dev

# Usar a imagem oficial do Node.js
FROM node:20-alpine

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos de manifesto
COPY package*.json ./

# Instalar todas as dependências (incluindo as de desenvolvimento)
RUN npm install

# O contêiner vai expor a porta 5173, onde o Vite irá rodar
EXPOSE 5173

# O comando para iniciar a aplicação será definido no docker-compose.yml
CMD ["npm", "run", "dev"]