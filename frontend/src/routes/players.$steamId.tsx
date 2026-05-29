import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import {
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { models } from "../../wailsjs/go/models";
import TrendChart, { type TrendPoint } from "../components/TrendChart";
import usePlayers from "../hooks/usePlayers";
import { radarFor } from "../lib/radar";

// Selectable trend metrics. `value` pulls the per-match number (or null when the
// stat wasn't measurable that match, so the chart skips it).
type MetricKey = "accuracy" | "flashAcc" | "enemyFlashes" | "adr";
const METRICS: Record<
	MetricKey,
	{
		label: string;
		unit: string;
		color: string;
		format: (v: number) => string;
		value: (m: models.PlayerGameStat) => number | null;
		empty: string;
	}
> = {
	accuracy: {
		label: "Accuracy",
		unit: "%",
		color: "#4f9dff",
		format: (v) => v.toFixed(0),
		value: (m) => (m.Accuracy < 0 ? null : m.Accuracy),
		empty: "No rifle/pistol/SMG shots recorded yet.",
	},
	flashAcc: {
		label: "Flash quality",
		unit: "s",
		color: "#ffb547",
		format: (v) => v.toFixed(2),
		value: (m) => (m.AvgBlindPerFlash < 0 ? null : m.AvgBlindPerFlash),
		empty: "No flashes thrown yet.",
	},
	enemyFlashes: {
		label: "Enemies flashed",
		unit: "",
		color: "#54d18c",
		format: (v) => v.toFixed(0),
		value: (m) => m.EnemyFlashes,
		empty: "No flash data yet.",
	},
	adr: {
		label: "ADR",
		unit: "",
		color: "#ff6f6f",
		format: (v) => v.toFixed(0),
		value: (m) => m.ADR,
		empty: "No damage data yet.",
	},
};

export const Route = createFileRoute("/players/$steamId")({
	component: PlayerProfilePage,
});

function Stat({ label, value }: { label: string; value: string | number }) {
	return (
		<Stack sx={{ alignItems: "center", minWidth: 72 }}>
			<Typography variant="h5" sx={{ fontWeight: 700 }}>
				{value}
			</Typography>
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
		</Stack>
	);
}

function PlayerProfilePage() {
	const { steamId } = Route.useParams();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<models.PlayerProfile | null>(null);
	const [metric, setMetric] = useState<MetricKey>("accuracy");

	const [editingName, setEditingName] = useState(false);
	const { getProfile, renamePlayer } = usePlayers();

	const load = useCallback(() => {
		return getProfile(steamId).then(setProfile);
	}, [getProfile, steamId]);

	useEffect(() => {
		load();
	}, [load]);

	// Persist a renamed player (blank reverts to the in-game name), then refetch.
	async function saveName(value: string) {
		setEditingName(false);
		await renamePlayer(steamId, value);
		await load();
	}

	const m = METRICS[metric];
	const trendPoints: TrendPoint[] = (profile?.Matches ?? []).map((match) => ({
		value: m.value(match),
		date: new Date(match.RecordedAt),
		map: match.Map,
	}));

	const kd =
		profile && profile.Deaths > 0
			? (profile.Kills / profile.Deaths).toFixed(2)
			: (profile?.Kills ?? 0).toFixed(2);

	return (
		<Stack spacing={2}>
			<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
				<Button
					component={Link}
					to="/players"
					startIcon={<ArrowBackIcon />}
				>
					Players
				</Button>
				{editingName ? (
					<TextField
						size="small"
						autoFocus
						defaultValue={profile?.Name ?? ""}
						placeholder="Player name"
						sx={{ flexGrow: 1 }}
						onBlur={(e) => saveName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter")
								saveName((e.target as HTMLInputElement).value);
							if (e.key === "Escape") setEditingName(false);
						}}
					/>
				) : (
					<>
						<Typography variant="h4" sx={{ flexGrow: 1 }} noWrap>
							{profile ? profile.Name || "Unknown player" : "Player"}
						</Typography>
						{profile && (
							<IconButton
								onClick={() => setEditingName(true)}
								aria-label="Rename player"
							>
								<EditIcon />
							</IconButton>
						)}
					</>
				)}
			</Stack>

			{!profile && <CircularProgress />}

			{profile && (
				<>
					<Card>
						<CardContent>
							<Stack
								direction="row"
								spacing={3}
								sx={{ flexWrap: "wrap", justifyContent: "center", gap: 2 }}
							>
								<Stat label="Games" value={profile.Games} />
								<Stat label="Kills" value={profile.Kills} />
								<Stat label="Assists" value={profile.Assists} />
								<Stat label="Deaths" value={profile.Deaths} />
								<Stat label="K/D" value={kd} />
								<Stat label="ADR" value={profile.ADR.toFixed(1)} />
							</Stack>
						</CardContent>
					</Card>

					{profile.Matches.length > 0 && (
						<Card>
							<CardContent>
								<Stack
									direction="row"
									spacing={2}
									sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }}
								>
									<Typography variant="h6">Trends over time</Typography>
									<ToggleButtonGroup
										size="small"
										exclusive
										value={metric}
										onChange={(_, v) => v && setMetric(v)}
									>
										<ToggleButton value="accuracy">Accuracy</ToggleButton>
										<ToggleButton value="flashAcc">Flash quality</ToggleButton>
										<ToggleButton value="enemyFlashes">
											Enemies flashed
										</ToggleButton>
										<ToggleButton value="adr">ADR</ToggleButton>
									</ToggleButtonGroup>
								</Stack>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ mb: 1 }}
								>
									{metric === "accuracy" &&
										"Share of grounded rifle/pistol/SMG shots taken slow enough to be accurate, per match."}
									{metric === "flashAcc" &&
										"Average enemy blind seconds per flashbang thrown — higher means better-placed flashes."}
									{metric === "enemyFlashes" &&
										"Number of enemy blind effects caused per match."}
									{metric === "adr" && "Average damage per round, per match."}
								</Typography>
								<TrendChart
									points={trendPoints}
									color={m.color}
									format={m.format}
									unit={m.unit}
									emptyLabel={m.empty}
								/>
							</CardContent>
						</Card>
					)}

					<Card>
						<CardContent>
							<Typography variant="h6" sx={{ mb: 1 }}>
								Matches
							</Typography>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Date</TableCell>
										<TableCell>Map</TableCell>
										<TableCell>Team</TableCell>
										<TableCell align="right">K</TableCell>
										<TableCell align="right">A</TableCell>
										<TableCell align="right">D</TableCell>
										<TableCell align="right">ADR</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{profile.Matches.map((m) => {
										const radar = radarFor(m.Map);
										const d = new Date(m.RecordedAt);
										return (
											<TableRow
												key={m.GameID}
												hover
												sx={{ cursor: "pointer" }}
												onClick={() =>
													navigate({
														to: "/demos/$demoId",
														params: { demoId: String(m.DemoID) },
													})
												}
											>
												<TableCell>
													{Number.isNaN(d.getTime())
														? "—"
														: d.toLocaleDateString("en-GB")}
												</TableCell>
												<TableCell>
													<Stack
														direction="row"
														spacing={1}
														sx={{ alignItems: "center" }}
													>
														{radar && (
															<Box
																sx={{
																	width: 28,
																	height: 28,
																	borderRadius: 0.5,
																	backgroundImage: `url(${radar})`,
																	backgroundSize: "cover",
																	backgroundPosition: "center",
																}}
															/>
														)}
														<span>{m.Map}</span>
													</Stack>
												</TableCell>
												<TableCell>{m.Team}</TableCell>
												<TableCell align="right">{m.Kills}</TableCell>
												<TableCell align="right">{m.Assists}</TableCell>
												<TableCell align="right">{m.Deaths}</TableCell>
												<TableCell align="right">{m.ADR.toFixed(1)}</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</>
			)}
		</Stack>
	);
}
