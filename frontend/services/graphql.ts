import { Chain } from 'zeus';
export const chain = Chain(import.meta.env.VITE_GRAPHQL_URL || "http://localhost:3000/graphql");

