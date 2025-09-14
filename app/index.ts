import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { builder } from "./builder";

const yoga = createYoga({
  schema: builder.toSchema(),
});

const server = createServer(yoga);
const port = 3000;

server.listen(port, () => {
  console.info(`Server is running on http://localhost:${port}${yoga.graphqlEndpoint}`);
});
