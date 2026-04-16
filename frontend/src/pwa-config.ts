import type { VitePWAOptions } from "vite-plugin-pwa"

export const pwaConfig: Partial<VitePWAOptions> = {
  manifest: {
    name: "ExSize",
    short_name: "ExSize",
    theme_color: "#1a7a5c",
    background_color: "#0a0a0a",
    display: "standalone",
    icons: [
      { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
}
