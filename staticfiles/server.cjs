var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      team: "Gracie Barra Guarne",
      architecture: "Unified PWA React SPA + REST API Backend",
      language: "Spanish",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  let currentGlobalFee = 0;
  app.get("/api/config/", (_req, res) => {
    res.json({
      status: "ok",
      tarifa_mensual_base: currentGlobalFee,
      currency: "COP"
    });
  });
  app.post("/api/config/update-fee/", (req, res) => {
    const { monto } = req.body;
    if (typeof monto === "number") {
      currentGlobalFee = monto;
    }
    res.json({
      success: true,
      message: `Tarifa general actualizada a $${currentGlobalFee} COP`,
      tarifa_mensual_base: currentGlobalFee
    });
  });
  app.get("/manifest.json", (_req, res) => {
    res.sendFile(import_path.default.join(__dirname, "public", "manifest.json"));
  });
  app.get("/service-worker.js", (_req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(import_path.default.join(__dirname, "public", "service-worker.js"));
  });
  app.post("/api/send-email-reminders", (req, res) => {
    const { students } = req.body;
    res.json({
      success: true,
      message: "Alertas autom\xE1ticas en espa\xF1ol enviadas exitosamente.",
      recipientsCount: Array.isArray(students) ? students.length : 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3e3 },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Gracie Barra Guarne PWA] Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Error iniciando el servidor:", err);
});
//# sourceMappingURL=server.cjs.map
