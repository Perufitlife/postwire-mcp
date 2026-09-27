# PostWire MCP server (stdio). Lists its tools without a key; set POSTWIRE_API_KEY to publish.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY index.js ./
ENTRYPOINT ["node", "index.js"]
