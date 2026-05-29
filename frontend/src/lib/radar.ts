// Radar overview images, keyed by file URL. Resolved at build time by Vite.
const radarModules = import.meta.glob("../images/radar/*_radar_psd.png", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

// radarFor returns the radar image URL for a CS2 map name (e.g. "de_dust2"),
// or undefined if we don't bundle that map.
export function radarFor(mapName?: string): string | undefined {
	if (!mapName) return undefined;
	const key = Object.keys(radarModules).find((k) =>
		k.endsWith(`/${mapName}_radar_psd.png`),
	);
	return key ? radarModules[key] : undefined;
}
