FROM node:22

COPY package.json .
RUN npm install

CMD ["npx", "ipx", "serve", "--port", "3000", "--host", "0.0.0.0"]
