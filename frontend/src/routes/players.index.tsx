import {
	Card,
	CardActionArea,
	CardContent,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import usePlayers from "../hooks/usePlayers";

export const Route = createFileRoute("/players/")({
	component: PlayersPage,
});

function PlayersPage() {
	const navigate = useNavigate();
	const { players } = usePlayers();

	return (
		<Stack spacing={2}>
			<Typography variant="h4">Players</Typography>

			{players.length === 0 && (
				<Typography color="text.secondary">
					No players yet — analyze a demo to populate this list.
				</Typography>
			)}

			{players.length > 0 && (
				<Card>
					<CardContent>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Player</TableCell>
									<TableCell align="right">Games</TableCell>
									<TableCell align="right">K</TableCell>
									<TableCell align="right">A</TableCell>
									<TableCell align="right">D</TableCell>
									<TableCell align="right">K/D</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{players.map((p) => (
									<TableRow
										key={p.SteamID}
										hover
										sx={{ cursor: "pointer" }}
										onClick={() =>
											navigate({
												to: "/players/$steamId",
												params: { steamId: p.SteamID },
											})
										}
									>
										<TableCell sx={{ fontWeight: 600 }}>{p.Name}</TableCell>
										<TableCell align="right">{p.Games}</TableCell>
										<TableCell align="right">{p.Kills}</TableCell>
										<TableCell align="right">{p.Assists}</TableCell>
										<TableCell align="right">{p.Deaths}</TableCell>
										<TableCell align="right">
											{p.Deaths > 0
												? (p.Kills / p.Deaths).toFixed(2)
												: p.Kills.toFixed(2)}
										</TableCell>
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
