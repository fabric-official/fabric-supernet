import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

function devAuthMock(): PluginOption {
  return {
    name: "dev-auth-mock",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        const method = (req.method ?? "GET").toUpperCase();
        if (!url.startsWith("/api/auth/")) return next();

        const me = {
          id: "dev-user",
          user_id: "dev-user",
          email: "dev@local.test",
          role: "admin",
          permissions: ["*"],
          full_name: "Dev User",
        };
        const ok = (obj, code = 200) => {
          res.statusCode = code;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(obj));
        };

        if (method === "GET" && url === "/api/auth/me") return ok(me);

        if (
          method === "POST" &&
          (url === "/api/auth/login" ||
           url === "/api/auth/register" ||
           url === "/api/auth/signin" ||
           url === "/api/auth/signup")
        ) {
          return ok({ id: me.id, email: me.email, token: "dev-token" });
        }

        if (method === "POST" && url === "/api/auth/signout") {
          res.statusCode = 204;
          return res.end();
        }

        return ok({ error: "not found" }, 404);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const BYPASS = String(env.VITE_BYPASS_AUTH || "").trim() === "1";
  const API_TARGET = env.VITE_API_TARGET || "http://127.0.0.1:8788";

  const plugins: PluginOption[] = [react()];
  if (BYPASS) plugins.push(devAuthMock());

  return {
    plugins,
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: {
      port: 5173,
      headers: {
        // Dev-only CSP that allows Vite HMR/SWC and local APIs
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173 http://127.0.0.1:8788 http://10.0.0.42:8080;"
      },
      proxy: BYPASS
        ? undefined
        : {
            "/api": {
              target: API_TARGET,
              changeOrigin: true,
              secure: false,
            },
          },
    },
    build: { sourcemap: true },
    define: { "process.env.NODE_ENV": JSON.stringify(mode) },
  };
});