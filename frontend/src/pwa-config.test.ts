import { describe, it, expect } from "vitest"
import { pwaConfig } from "./pwa-config"

const manifest =
  typeof pwaConfig.manifest === "object" ? pwaConfig.manifest : undefined

describe("PWA config", () => {
  it("has app name ExSize", () => {
    expect(manifest?.name).toBe("ExSize")
    expect(manifest?.short_name).toBe("ExSize")
  })

  it("has theme and background colors", () => {
    expect(manifest?.theme_color).toBe("#1a7a5c")
    expect(manifest?.background_color).toBe("#0a0a0a")
  })

  it("uses standalone display mode", () => {
    expect(manifest?.display).toBe("standalone")
  })

  it("has icons at 192x192 and 512x512", () => {
    const icons = manifest?.icons
    expect(icons).toBeDefined()
    expect(icons).toContainEqual(
      expect.objectContaining({ sizes: "192x192", type: "image/png" })
    )
    expect(icons).toContainEqual(
      expect.objectContaining({ sizes: "512x512", type: "image/png" })
    )
  })
})
