import { createYoga } from "graphql-yoga";
import { builder } from "./builder-simple";

const yoga = createYoga({
  schema: builder.toSchema(),
});
const server = Bun.serve({
  fetch: yoga,
});

console.info(
  `Server is running on ${new URL(
    yoga.graphqlEndpoint,
    `http://${server.hostname}:${server.port}`
  )}`
);
