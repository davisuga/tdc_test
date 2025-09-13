const server = Bun.serve({
  port: 8080,
  fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/health") {
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
    
    if (url.pathname === "/") {
      return new Response("Hello, world", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Health API server running on port ${server.port}`);
console.log(`Health endpoint available at: http://localhost:${server.port}/health`);
