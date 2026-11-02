/* lib/mapConfig.ts — Centralized map tile provider configuration */

export interface MapTileConfig {
  url: string;
  attribution: string;
  subdomains: string;
  maxZoom: number;
}

export function getMapTileConfig(
  cartoKey: string | undefined = process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY
): MapTileConfig {
  if (cartoKey && cartoKey.trim().length > 0) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(
        cartoKey.trim()
      )}`,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    };
  }

  // Permitted public OpenStreetMap basemap without watermark and with proper attribution
  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    subdomains: "abc",
    maxZoom: 19,
  };
}

export const mapTiles = getMapTileConfig();
