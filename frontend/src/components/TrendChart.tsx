import { Box, Typography } from "@mui/material";
import { useState } from "react";

// One point on the trend line. `value` is null when the stat wasn't measurable
// in that match (e.g. no shots taken) — those points are skipped, not zeroed.
export type TrendPoint = {
	value: number | null;
	date: Date;
	map: string;
};

// Internal SVG coordinate system; scaled to the container via viewBox.
const W = 640;
const H = 260;
const M = { top: 16, right: 16, bottom: 30, left: 48 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

const fmtDate = (d: Date) =>
	Number.isNaN(d.getTime())
		? "—"
		: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });

// Least-squares slope/intercept over (index, value) for the dashed trend line.
function regression(values: number[]) {
	const n = values.length;
	if (n < 2) return null;
	let sx = 0;
	let sy = 0;
	let sxy = 0;
	let sxx = 0;
	for (let i = 0; i < n; i++) {
		sx += i;
		sy += values[i];
		sxy += i * values[i];
		sxx += i * i;
	}
	const denom = n * sxx - sx * sx;
	if (denom === 0) return null;
	const slope = (n * sxy - sx * sy) / denom;
	const intercept = (sy - slope * sx) / n;
	return { slope, intercept };
}

export default function TrendChart({
	points,
	color = "#4f9dff",
	format = (v) => v.toFixed(1),
	unit = "",
	emptyLabel = "No data for this stat yet.",
}: {
	points: TrendPoint[];
	color?: string;
	format?: (v: number) => string;
	unit?: string;
	emptyLabel?: string;
}) {
	const [hover, setHover] = useState<number | null>(null);

	// Keep only measurable matches, preserving chronological order.
	const data = points
		.map((p, i) => ({ ...p, order: i }))
		.filter((p): p is TrendPoint & { order: number; value: number } =>
			p.value != null,
		);

	if (data.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
				{emptyLabel}
			</Typography>
		);
	}

	const values = data.map((d) => d.value);
	let min = Math.min(...values);
	let max = Math.max(...values);
	if (min === max) {
		// Flat series: pad so the line sits mid-chart instead of on an edge.
		const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1;
		min -= pad;
		max += pad;
	} else {
		const pad = (max - min) * 0.1;
		min -= pad;
		max += pad;
	}

	const n = data.length;
	const xAt = (i: number) => (n === 1 ? M.left + IW / 2 : M.left + (i / (n - 1)) * IW);
	const yAt = (v: number) => M.top + (1 - (v - min) / (max - min)) * IH;

	const linePath = data
		.map((d, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(d.value).toFixed(1)}`)
		.join(" ");

	// Horizontal gridlines + y-axis value labels.
	const ticks = 4;
	const gridY = Array.from({ length: ticks + 1 }, (_, i) => {
		const v = min + (i / ticks) * (max - min);
		return { v, y: yAt(v) };
	});

	// X labels: first, last, and a few evenly spaced between (skip when crowded).
	const step = Math.max(1, Math.ceil(n / 6));
	const xLabelIdx = new Set<number>([0, n - 1]);
	for (let i = 0; i < n; i += step) xLabelIdx.add(i);

	const reg = regression(values);
	const trend =
		reg &&
		`M ${xAt(0).toFixed(1)} ${yAt(reg.intercept).toFixed(1)} L ${xAt(n - 1).toFixed(1)} ${yAt(reg.intercept + reg.slope * (n - 1)).toFixed(1)}`;

	const hd = hover != null ? data[hover] : null;

	return (
		<Box sx={{ width: "100%" }}>
			<Box
				component="svg"
				viewBox={`0 0 ${W} ${H}`}
				sx={{ width: "100%", height: "auto", display: "block" }}
			>
				{/* gridlines + y labels */}
				{gridY.map((g) => (
					<g key={g.v}>
						<line
							x1={M.left}
							x2={W - M.right}
							y1={g.y}
							y2={g.y}
							stroke="currentColor"
							strokeOpacity={0.12}
						/>
						<text
							x={M.left - 8}
							y={g.y + 4}
							textAnchor="end"
							fontSize={12}
							fill="currentColor"
							opacity={0.6}
						>
							{format(g.v)}
						</text>
					</g>
				))}

				{/* x labels */}
				{data.map((d, i) =>
					xLabelIdx.has(i) ? (
						<text
							key={`x-${d.order}`}
							x={xAt(i)}
							y={H - 8}
							textAnchor="middle"
							fontSize={12}
							fill="currentColor"
							opacity={0.6}
						>
							{fmtDate(d.date)}
						</text>
					) : null,
				)}

				{/* trend line */}
				{trend && (
					<path
						d={trend}
						fill="none"
						stroke={color}
						strokeOpacity={0.4}
						strokeWidth={1.5}
						strokeDasharray="5 5"
					/>
				)}

				{/* value line */}
				{n > 1 && (
					<path d={linePath} fill="none" stroke={color} strokeWidth={2.5} />
				)}

				{/* points + hover targets */}
				{data.map((d, i) => (
					<circle
						key={`p-${d.order}`}
						cx={xAt(i)}
						cy={yAt(d.value)}
						r={hover === i ? 6 : 4}
						fill={color}
						stroke="#fff"
						strokeWidth={hover === i ? 2 : 1}
						style={{ cursor: "pointer" }}
						onMouseEnter={() => setHover(i)}
						onMouseLeave={() => setHover(null)}
					/>
				))}

				{/* tooltip */}
				{hd && (
					<g pointerEvents="none">
						{(() => {
							const cx = xAt(hover!);
							const cy = yAt(hd.value);
							const label = `${format(hd.value)}${unit}`;
							const sub = `${hd.map} · ${fmtDate(hd.date)}`;
							const bw = Math.max(label.length, sub.length) * 7 + 16;
							const bx = Math.min(Math.max(cx - bw / 2, 2), W - bw - 2);
							const by = Math.max(cy - 52, 2);
							return (
								<>
									<rect
										x={bx}
										y={by}
										width={bw}
										height={40}
										rx={4}
										fill="#1e1e1e"
										stroke={color}
										strokeOpacity={0.5}
									/>
									<text x={bx + 8} y={by + 17} fontSize={13} fontWeight={700} fill="#fff">
										{label}
									</text>
									<text x={bx + 8} y={by + 32} fontSize={11} fill="#bbb">
										{sub}
									</text>
								</>
							);
						})()}
					</g>
				)}
			</Box>
		</Box>
	);
}
