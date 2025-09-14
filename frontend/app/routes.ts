import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("submissions/:id", "routes/submission.tsx")
] satisfies RouteConfig;
