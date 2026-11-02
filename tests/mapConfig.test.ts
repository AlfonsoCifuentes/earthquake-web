import { describe, it, expect } from "vitest";
import { getMapTileConfig } from "../lib/mapConfig";

describe("getMapTileConfig", () => {
  it("provides valid tile URL and attribution without key (fallback to OSM)", () => {
    const config = getMapTileConfig(undefined);
    expect(config.url).toContain("tile.openstreetmap.org");
    expect(config.attribution).toContain("OpenStreetMap");
    expect(config.url).not.toContain("API KEY REQUIRED");
  });

  it("provides CARTO basemap when key is present", () => {
    const config = getMapTileConfig("test-carto-key");
    expect(config.url).toContain("basemaps.cartocdn.com");
    expect(config.url).toContain("test-carto-key");
    expect(config.attribution).toContain("CARTO");
  });
});
