import {
	Box,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import type { models } from "../../wailsjs/go/models";
import { radarFor } from "../lib/radar";

const SIZE = 512; // internal canvas resolution (radar images are square)
const RADIUS = 18; // influence radius of each point, in canvas px

type Kind = "death" | "kill" | "both";

// Both HeatmapPoint and UtilityPoint share this shape, so the component renders
// either kind/death frags or grenade pops from the same code.
type Point = Pick<models.HeatmapPoint, "X" | "Y" | "Kind" | "SteamID">;

// buildPalette maps intensity 0..255 to a blue→cyan→green→yellow→red gradient.
function buildPalette(): Uint8ClampedArray {
	const c = document.createElement("canvas");
	c.width = 256;
	c.height = 1;
	const cx = c.getContext("2d")!;
	const grad = cx.createLinearGradient(0, 0, 256, 0);
	grad.addColorStop(0.0, "#2222ff");
	grad.addColorStop(0.35, "#00ffff");
	grad.addColorStop(0.55, "#00ff00");
	grad.addColorStop(0.75, "#ffff00");
	grad.addColorStop(1.0, "#ff0000");
	cx.fillStyle = grad;
	cx.fillRect(0, 0, 256, 1);
	return cx.getImageData(0, 0, 256, 1).data;
}

export default function Heatmap({
	mapName,
	points,
	highlightSteamID,
	highlightName,
	maxWidth = 520,
	kindFilter,
	emptyLabel,
}: {
	mapName?: string;
	points: Point[];
	// When set, show only this player's points (shooter for kills, victim for deaths).
	highlightSteamID?: number;
	highlightName?: string;
	maxWidth?: number;
	// When set, hide the kill/death toggle and show only points of this Kind
	// (e.g. "flash"). Used for the utility-pop heatmap.
	kindFilter?: string;
	// Caption shown when there are no points to plot (utility mode).
	emptyLabel?: string;
}) {
	const radar = radarFor(mapName);
	const [kind, setKind] = useState<Kind>("death");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const palette = useMemo(buildPalette, []);

	const filtered = useMemo(
		() =>
			points.filter(
				(p) =>
					(kindFilter != null
						? p.Kind === kindFilter
						: kind === "both" || p.Kind === kind) &&
					(highlightSteamID == null || p.SteamID === highlightSteamID),
			),
		[points, kind, kindFilter, highlightSteamID],
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// 1. Accumulate intensity into an offscreen alpha layer.
		const off = document.createElement("canvas");
		off.width = SIZE;
		off.height = SIZE;
		const octx = off.getContext("2d")!;
		for (const p of filtered) {
			const x = p.X * SIZE;
			const y = p.Y * SIZE;
			const g = octx.createRadialGradient(x, y, 0, x, y, RADIUS);
			g.addColorStop(0, "rgba(0,0,0,0.4)");
			g.addColorStop(1, "rgba(0,0,0,0)");
			octx.fillStyle = g;
			octx.fillRect(x - RADIUS, y - RADIUS, RADIUS * 2, RADIUS * 2);
		}

		// 2. Colorize: map accumulated alpha → gradient palette.
		const src = octx.getImageData(0, 0, SIZE, SIZE);
		const out = ctx.createImageData(SIZE, SIZE);
		for (let i = 0; i < src.data.length; i += 4) {
			const a = src.data[i + 3];
			if (a === 0) continue;
			const pi = a * 4;
			out.data[i] = palette[pi];
			out.data[i + 1] = palette[pi + 1];
			out.data[i + 2] = palette[pi + 2];
			out.data[i + 3] = Math.min(255, a + 60); // lift low-density spots
		}
		ctx.clearRect(0, 0, SIZE, SIZE);
		ctx.putImageData(out, 0, 0);
	}, [filtered, palette]);

	if (!radar) return null;

	return (
		<Stack spacing={1} sx={{ alignItems: "center" }}>
			{kindFilter == null && (
				<ToggleButtonGroup
					size="small"
					exclusive
					value={kind}
					onChange={(_, v) => v && setKind(v)}
				>
					<ToggleButton value="death">Deaths</ToggleButton>
					<ToggleButton value="kill">Kills</ToggleButton>
					<ToggleButton value="both">Both</ToggleButton>
				</ToggleButtonGroup>
			)}

			<Typography variant="body2" color="text.secondary" sx={{ minHeight: 20 }}>
				{filtered.length === 0 && emptyLabel
					? emptyLabel
					: highlightName
						? `Showing: ${highlightName}`
						: "All players"}
			</Typography>

			<Box
				sx={{
					position: "relative",
					width: "100%",
					maxWidth,
					aspectRatio: "1 / 1",
				}}
			>
				<Box
					component="img"
					src={radar}
					alt={mapName}
					sx={{
						position: "absolute",
						inset: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
					}}
				/>
				<canvas
					ref={canvasRef}
					width={SIZE}
					height={SIZE}
					style={{
						position: "absolute",
						inset: 0,
						width: "100%",
						height: "100%",
					}}
				/>
			</Box>
		</Stack>
	);
}
