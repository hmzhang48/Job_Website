Copy-Item ("package.json","drizzle.config.js" | % {"./packages/fastify/$_"}) -Destination "./docker/node"
Copy-Item "./packages/fastify/dist/*" -Destination "./docker/node/server" -Recurse
Copy-Item "./packages/vue/dist/*" -Destination "./docker/caddy/root" -Recurse