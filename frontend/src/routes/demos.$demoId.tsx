import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
	AnalyzeDemo,
	GetGame,
	SetGameRecordedAt,
} from "../../wailsjs/go/main/App";
import type { models } from "../../wailsjs/go/models";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import useDemos from "../hooks/useDemos";
import { Edit, Refresh } from "@mui/icons-material";
import Heatmap from "../components/Heatmap";

export const Route = createFileRoute("/demos/$demoId")({
	component: DemoDetailPage,
});

// biome-ignore lint/suspicious/noExplicitAny: time.Time serializes as any
function formatDateTime(value: any) {
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB");
}

// thrown ÷ acquired as a percentage.
function pct(n: number, d: number) {
	return d > 0 ? `${Math.round((n / d) * 100)}%` : "—";
}

// per-grenade average (damage or seconds), one decimal.
function avg(n: number, d: number) {
	return d > 0 ? (n / d).toFixed(1) : "—";
}

// Convert an ISO/date value to the "YYYY-MM-DDTHH:mm" format <input datetime-local> wants.
// biome-ignore lint/suspicious/noExplicitAny: time.Time serializes as any
function toDateTimeLocal(value: any) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DemoDetailPage() {
	const { demoId } = Route.useParams();
	const { demos } = useDemos();
	const demo = demos.find((d) => d.ID === Number(demoId));

	const [result, setResult] = useState<models.Game | null>(null);
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(() => {
		setFetching(true);
		return GetGame(Number(demoId))
			.then((game) => setResult(game ?? null))
			.catch((e) => setError(String(e)))
			.finally(() => setFetching(false));
	}, [demoId]);

	// Load any previously stored analysis from the DB — no re-parse needed.
	useEffect(() => {
		refresh();
	}, [refresh]);

	// Background analysis (triggered when a demo is added) emits this event on
	// completion — refetch when it's for the demo we're viewing.
	useEffect(() => {
		const off = EventsOn("demo:analyzed", (payload: { demoID: number }) => {
			if (payload?.demoID === Number(demoId)) refresh();
		});
		return off;
	}, [demoId, refresh]);

	async function analyze() {
		setLoading(true);
		setError(null);
		try {
			const res = await AnalyzeDemo(Number(demoId));
			setResult(res);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	}

	const [hovered, setHovered] = useState<{ id: number; name: string } | null>(
		null,
	);
	const [editingDate, setEditingDate] = useState(false);
	const [utilType, setUtilType] = useState<
		"flash" | "he" | "molotov" | "smoke" | "decoy"
	>("flash");
	async function saveRecordedAt(value: string) {
		const ms = new Date(value).getTime();
		setEditingDate(false);
		if (Number.isNaN(ms)) return;
		await SetGameRecordedAt(Number(demoId), ms);
		await refresh();
	}

	const players = [...(result?.Players ?? [])].sort(
		(a, b) => b.Kills - a.Kills || a.Deaths - b.Deaths,
	);
	const teams = result?.Teams ?? [];
	const rounds = [...(result?.Rounds ?? [])].sort(
		(a, b) => a.Number - b.Number,
	);
	// Display label per grenade type (for captions/empty states).
	const utilLabel: Record<typeof utilType, string> = {
		flash: "flash",
		he: "HE",
		molotov: "molotov",
		smoke: "smoke",
		decoy: "decoy",
	};
	// Per-grenade-type accessors and columns for the Utility card.
	const acqOf = (p: models.PlayerStats) =>
		({
			flash: p.FlashesAcquired,
			he: p.HEAcquired,
			molotov: p.MolotovAcquired,
			smoke: p.SmokeAcquired,
			decoy: p.DecoyAcquired,
		})[utilType];
	const thrOf = (p: models.PlayerStats) =>
		({
			flash: p.FlashesThrown,
			he: p.HEThrown,
			molotov: p.MolotovThrown,
			smoke: p.SmokeThrown,
			decoy: p.DecoyThrown,
		})[utilType];

	type UtilCol = {
		label: string;
		cell: (p: models.PlayerStats) => React.ReactNode;
	};
	const baseCols: UtilCol[] = [
		{ label: "Acq", cell: acqOf },
		{ label: "Thrown", cell: thrOf },
		{ label: "Use%", cell: (p) => pct(thrOf(p), acqOf(p)) },
	];
	const extraCols: UtilCol[] =
		utilType === "flash"
			? [
					{
						label: "Avg blind",
						cell: (p) =>
							p.FlashesThrown > 0
								? `${(p.EnemyFlashSeconds / p.FlashesThrown).toFixed(2)}s`
								: "—",
					},
					{ label: "Enemy s", cell: (p) => p.EnemyFlashSeconds.toFixed(1) },
					{ label: "Team s", cell: (p) => p.TeamFlashSeconds.toFixed(1) },
					{ label: "Died with", cell: (p) => p.FlashesDiedWith },
				]
			: utilType === "he"
				? [
						{ label: "Damage", cell: (p) => p.HEDamage },
						{ label: "Avg dmg", cell: (p) => avg(p.HEDamage, p.HEThrown) },
					]
				: utilType === "molotov"
					? [
							{ label: "Damage", cell: (p) => p.MolotovDamage },
							{
								label: "Avg dmg",
								cell: (p) => avg(p.MolotovDamage, p.MolotovThrown),
							},
						]
					: [];
	const utilCols = [...baseCols, ...extraCols];
	const utilPlayers = [...(result?.Players ?? [])].sort((a, b) => {
		switch (utilType) {
			case "he":
				return b.HEDamage - a.HEDamage;
			case "molotov":
				return b.MolotovDamage - a.MolotovDamage;
			case "smoke":
				return b.SmokeThrown - a.SmokeThrown;
			case "decoy":
				return b.DecoyThrown - a.DecoyThrown;
			default:
				return b.EnemyFlashSeconds - a.EnemyFlashSeconds;
		}
	});

	// Shooting-while-moving accuracy. Accurate% = accurate ÷ (accurate + running),
	// excluding jump shots. Computed overall and per weapon class.
	const accRows = (result?.Players ?? [])
		.map((p) => {
			const rifleA = p.RifleAccurate;
			const rifleR = p.RifleRunning;
			const pistolA = p.PistolAccurate;
			const pistolR = p.PistolRunning;
			const smgA = p.SMGAccurate;
			const smgR = p.SMGRunning;
			const accurate = rifleA + pistolA + smgA;
			const running = rifleR + pistolR + smgR;
			const jump = p.RifleJump + p.PistolJump + p.SMGJump;
			return {
				name: p.Name,
				steamID: p.SteamID,
				shots: accurate + running,
				accurate,
				running,
				jump,
				rifle: { a: rifleA, r: rifleR },
				pistol: { a: pistolA, r: pistolR },
				smg: { a: smgA, r: smgR },
			};
		})
		.filter((r) => r.shots + r.jump > 0)
		.sort((a, b) => b.accurate / (b.shots || 1) - a.accurate / (a.shots || 1));

	// Accurate% from an accurate/running pair, or "—" when no shots.
	const accPct = (a: number, r: number) =>
		a + r > 0 ? `${Math.round((100 * a) / (a + r))}%` : "—";

	// Group players by team, ordered to match the team-score ordering (winner
	// first). Any players whose team is unknown fall into a trailing group.
	const teamOrder = teams.map((t) => t.Name);
	const grouped = new Map<string, typeof players>();
	for (const p of players) {
		const key = p.Team || "Unknown";
		(grouped.get(key) ?? grouped.set(key, []).get(key)!).push(p);
	}
	const playerGroups = [...grouped.keys()]
		.sort((a, b) => {
			const ia = teamOrder.indexOf(a);
			const ib = teamOrder.indexOf(b);
			return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
		})
		.map((name) => ({ name, players: grouped.get(name)! }));

	return (
		<Stack spacing={2}>
			<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
				<Button component={Link} to="/demos" startIcon={<ArrowBackIcon />}>
					Back to demos
				</Button>
				<Typography variant="h4" sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
					{result?.MapName || demo?.Game?.MapName || "Match"}
				</Typography>
				{loading || fetching ? (
					<Box sx={{ px: 1, display: "flex" }}>
						<CircularProgress size={28} />
					</Box>
				) : (
					<IconButton onClick={analyze} disabled={loading || fetching}>
						<Refresh />
					</IconButton>
				)}
			</Stack>

			{error && <Alert severity="error">{error}</Alert>}

			{!fetching && !result && (
				<Alert severity="info" icon={<CircularProgress size={18} />}>
					Analyzing demo… results will appear automatically when ready.
				</Alert>
			)}

			{result && !result.FileExists && (
				<Alert severity="warning">
					The demo file could not be found on disk — it may have been moved or
					deleted.
				</Alert>
			)}

			{result?.FileExists && teams.length > 0 && (
				<Stack spacing={2}>
					<Typography variant="h4" sx={{ flex: 1, textAlign: "center" }}>
						{result.MapName}
					</Typography>
					<Stack
						direction="row"
						spacing={3}
						sx={{ alignItems: "center", justifyContent: "center", mb: 2 }}
					>
						<Typography variant="h6" sx={{ flex: 1, textAlign: "right" }}>
							{teams[0].Name}
						</Typography>
						<Typography variant="h3" sx={{ fontWeight: 700 }}>
							{teams[0].Score} : {teams[1]?.Score ?? 0}
						</Typography>
						<Typography variant="h6" sx={{ flex: 1, textAlign: "left" }}>
							{teams[1]?.Name ?? "—"}
						</Typography>
					</Stack>
				</Stack>
			)}

			{result?.FileExists && (
				<Stack
					direction="row"
					spacing={1}
					sx={{ alignItems: "center", justifyContent: "center" }}
				>
					<Typography color="text.secondary">Recorded</Typography>
					{editingDate ? (
						<TextField
							type="datetime-local"
							size="small"
							autoFocus
							defaultValue={toDateTimeLocal(result.RecordedAt)}
							onBlur={(e) => saveRecordedAt(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter")
									saveRecordedAt((e.target as HTMLInputElement).value);
								if (e.key === "Escape") setEditingDate(false);
							}}
						/>
					) : (
						<>
							<Typography sx={{ fontWeight: 500 }}>
								{formatDateTime(result.RecordedAt)}
							</Typography>
							<IconButton
								size="small"
								onClick={() => setEditingDate(true)}
								aria-label="Edit match date"
							>
								<Edit fontSize="small" />
							</IconButton>
						</>
					)}
				</Stack>
			)}

			{result?.FileExists && players.length > 0 && (
				<Stack
					direction={{ xs: "column", md: "row" }}
					spacing={2}
					sx={{ alignItems: "flex-start" }}
				>
					{(result.Heatmap?.length ?? 0) > 0 && (
						<Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
							<Heatmap
								mapName={result.MapName}
								points={result.Heatmap}
								highlightSteamID={hovered?.id}
								highlightName={hovered?.name}
								maxWidth={360}
							/>
						</Box>
					)}
					<Card sx={{ flexGrow: 1, minWidth: 0, width: "100%" }}>
						<CardContent>
							<Typography variant="h6" sx={{ mb: 1 }}>
								Scoreboard
							</Typography>
							<Stack spacing={2}>
								{playerGroups.map((group, gi) => {
									const score = teams.find((t) => t.Name === group.name)?.Score;
									// First team blue, second team gold — matching the in-game look.
									const headerBg = gi === 0 ? "#3a5f86" : "#8a7236";
									const numCol = { width: 56 };
									return (
										<Table size="small" key={group.name}>
											<TableHead>
												<TableRow
													sx={{ "& th": { bgcolor: headerBg, color: "#fff" } }}
												>
													<TableCell sx={{ fontWeight: 700, fontSize: 15 }}>
														{group.name}
														{score !== undefined ? `  ${score}` : ""}
													</TableCell>
													<TableCell align="right" sx={numCol}>
														K
													</TableCell>
													<TableCell align="right" sx={numCol}>
														A
													</TableCell>
													<TableCell align="right" sx={numCol}>
														D
													</TableCell>
													<TableCell align="right" sx={numCol}>
														ADR
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{group.players.map((p, i) => {
													const adr =
														rounds.length > 0
															? (p.Damage / rounds.length).toFixed(1)
															: "—";
													return (
														<TableRow key={`${p.Name}-${i}`}>
															<TableCell
																sx={{ fontWeight: 600, cursor: "pointer" }}
																onMouseEnter={() =>
																	setHovered({ id: p.SteamID, name: p.Name })
																}
																onMouseLeave={() => setHovered(null)}
															>
																{p.Name}
															</TableCell>
															<TableCell align="right" sx={numCol}>
																{p.Kills}
															</TableCell>
															<TableCell align="right" sx={numCol}>
																{p.Assists}
															</TableCell>
															<TableCell align="right" sx={numCol}>
																{p.Deaths}
															</TableCell>
															<TableCell align="right" sx={numCol}>
																{adr}
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									);
								})}
							</Stack>
						</CardContent>
					</Card>
				</Stack>
			)}

			{result?.FileExists && players.length > 0 && (
				<Card>
					<CardContent>
						<Stack
							direction="row"
							spacing={2}
							sx={{ alignItems: "center", mb: 1, flexWrap: "wrap" }}
						>
							<Typography variant="h6">Utility</Typography>
							<ToggleButtonGroup
								size="small"
								exclusive
								value={utilType}
								onChange={(_, v) => v && setUtilType(v)}
							>
								<ToggleButton value="flash">Flash</ToggleButton>
								<ToggleButton value="he">HE</ToggleButton>
								<ToggleButton value="molotov">Molotov</ToggleButton>
								<ToggleButton value="smoke">Smoke</ToggleButton>
								<ToggleButton value="decoy">Decoy</ToggleButton>
							</ToggleButtonGroup>
						</Stack>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Acq = grenades obtained (buys + mid-round pickups). Use% = thrown
							÷ acquired. Hover a player to see where their{" "}
							{utilLabel[utilType]}s popped.
							{utilType === "flash" &&
								" Avg blind = enemy blind seconds per flash thrown."}
							{(utilType === "he" || utilType === "molotov") &&
								" Avg dmg = enemy damage per grenade thrown."}
						</Typography>
						<Stack
							direction={{ xs: "column", md: "row" }}
							spacing={2}
							sx={{ alignItems: "flex-start" }}
						>
							<Box sx={{ flexGrow: 1, minWidth: 0, width: "100%" }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Player</TableCell>
											{utilCols.map((c) => (
												<TableCell key={c.label} align="right">
													{c.label}
												</TableCell>
											))}
										</TableRow>
									</TableHead>
									<TableBody>
										{utilPlayers.map((p, i) => (
											<TableRow
												key={`${p.Name}-${i}`}
												hover
												onMouseEnter={() =>
													setHovered({ id: p.SteamID, name: p.Name })
												}
												onMouseLeave={() => setHovered(null)}
											>
												<TableCell sx={{ fontWeight: 600 }}>{p.Name}</TableCell>
												{utilCols.map((c) => (
													<TableCell key={c.label} align="right">
														{c.cell(p)}
													</TableCell>
												))}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Box>
							{(result.Utility?.length ?? 0) > 0 && (
								<Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
									<Heatmap
										mapName={result.MapName}
										points={result.Utility}
										kindFilter={utilType}
										highlightSteamID={hovered?.id}
										highlightName={hovered?.name}
										emptyLabel={`No ${utilLabel[utilType]} pops`}
										maxWidth={360}
									/>
								</Box>
							)}
						</Stack>
					</CardContent>
				</Card>
			)}

			{result?.FileExists && accRows.length > 0 && (
				<Card>
					<CardContent>
						<Typography variant="h6" sx={{ mb: 1 }}>
							Shooting accuracy
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Acc% = shots fired while stationary enough to be accurate (≤ 34%
							of the weapon's max move speed), as a share of grounded shots.
							Running% is the rest. Jumping shots are excluded from the ratio
							and shown separately. Counts rifles, pistols and SMGs (incl.
							snipers); shotguns, LMGs, knives and grenades are ignored.
						</Typography>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Player</TableCell>
									<TableCell align="right">Acc%</TableCell>
									<TableCell align="right">Running%</TableCell>
									<TableCell align="right">Shots</TableCell>
									<TableCell align="right">Rifle</TableCell>
									<TableCell align="right">Pistol</TableCell>
									<TableCell align="right">SMG</TableCell>
									<TableCell align="right">Jumps</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{accRows.map((r, i) => (
									<TableRow
										key={`${r.name}-${i}`}
										hover
										onMouseEnter={() =>
											setHovered({ id: r.steamID, name: r.name })
										}
										onMouseLeave={() => setHovered(null)}
									>
										<TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
										<TableCell align="right" sx={{ fontWeight: 600 }}>
											{accPct(r.accurate, r.running)}
										</TableCell>
										<TableCell align="right">
											{accPct(r.running, r.accurate)}
										</TableCell>
										<TableCell align="right">{r.shots}</TableCell>
										<TableCell align="right">
											{accPct(r.rifle.a, r.rifle.r)}
										</TableCell>
										<TableCell align="right">
											{accPct(r.pistol.a, r.pistol.r)}
										</TableCell>
										<TableCell align="right">
											{accPct(r.smg.a, r.smg.r)}
										</TableCell>
										<TableCell align="right">{r.jump}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</Stack>
	);
}
