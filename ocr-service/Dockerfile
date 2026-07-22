FROM alpine:3.24

RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-por nodejs npm

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./

EXPOSE 3002

CMD ["node", "server.js"]
