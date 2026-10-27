// MapLibre finds its worker next to its own module, which the bundler moves. Serve the worker from public/
// and point MapLibre at it with setWorkerUrl (see components/map/MapCanvas.tsx).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs"));
const publicDir = join(import.meta.dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });
copyFileSync(join(dist, "maplibre-gl-worker.mjs"), join(publicDir, "maplibre-gl-worker.mjs"));
