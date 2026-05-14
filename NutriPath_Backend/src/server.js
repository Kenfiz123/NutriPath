import { createServer } from "./app.js";

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "127.0.0.1";

const server = await createServer();

server.listen(port, host, () => {
  console.log(`NutriPath API listening at http://${host}:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down NutriPath API...`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
