import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function mockAuth() {
  return {
    name: "mock-auth",
    apply: "serve",
    configureServer(server) {
      const json = (res, body, code = 200) => {
        res.statusCode = code;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(body));
      };
      server.middlewares.use("/api/auth/me", (req, res) =>
        json(res, {
          id: "dev-guest",
          user_id: "dev-guest",
          email: "dev@local",
          role: "admin",
          permissions: ["*"],
          full_name: "Developer (Bypass)"
        })
      );
      server.middlewares.use("/api/auth/login", (req, res) =>
        json(res, { id: "dev-guest", email: "dev@local", token: "dev-token" })
      );
      server.middlewares.use("/api/auth/register", (req, res) =>
        json(res, { id: "dev-guest", email: "dev@local", token: "dev-token" })
      );
      server.middlewares.use("/api/auth/signout", (req, res) => {
        res.statusCode = 204; res.end();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const BYPASS = String(env.VITE_BYPASS_AUTH || "") === "1";
  return {
    plugins: BYPASS ? [react(), mockAuth()] : [react()],
    resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
    server: {
      headers: { 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173 http://127.0.0.1:8788 http://10.0.0.42:8080;" },
      host: "127.0.0.1",
      port: 5173,
      proxy: BYPASS ? undefined : {
        "/api": {
          target: env.VITE_API_TARGET || "http://localhost:8080",
          changeOrigin: true,
          secure: false
          // keep path as /api/*
        }
      }
    },
    define: { "process.env.NODE_ENV": JSON.stringify(mode) },
    build: { sourcemap: true }
  };
});
