New-Item -ItemType "Directory" -Path (("png","pdf" | % {"./docker/node/app/public/$_"}) + "./docker/node/app/server")
Copy-Item ("package.json","drizzle.config.js" | % {"./packages/fastify/$_"}) -Destination "./docker/node/app"
Copy-Item "./packages/fastify/dist/*" -Destination "./docker/node/app/server" -Recurse
Copy-Item "./packages/vue/dist/*" -Destination "./docker/node/app/public" -Recurse