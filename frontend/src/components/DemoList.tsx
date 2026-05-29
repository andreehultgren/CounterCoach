import EditIcon from "@mui/icons-material/Edit";
import {
	Box,
	Button,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SelectDemoFiles } from "../../wailsjs/go/main/App";
import type { models } from "../../wailsjs/go/models";
import useDemos from "../hooks/useDemos";
import { radarFor } from "../lib/radar";

// "16 : 14" from the two team scores, or a status string when not analyzed yet.
function formatResult(game?: models.Game): string {
	if (!game) return "Analyzing…";
	const teams = game.Teams ?? [];
	if (teams.length >= 2) return `${teams[0].Score} : ${teams[1].Score}`;
	return "—";
}

// Day-month-year timestamp (match date when analyzed, else import time).
// biome-ignore lint/suspicious/noExplicitAny: time.Time serializes as any
function formatTimestamp(value: any): string {
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB");
}

export default function DemoList() {
	const { demos, updateDemo, deleteDemo } = useDemos();
	const navigate = useNavigate();
	const [editing, setEditing] = useState<models.Demo | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<models.Demo | null>(null);
	const [path, setPath] = useState("");

	function openEdit(demo: models.Demo) {
		setEditing(demo);
		setPath(demo.Path);
	}

	function closeEdit() {
		setEditing(null);
	}

	async function browse() {
		const files = await SelectDemoFiles();
		if (files && files.length > 0) setPath(files[0]);
	}

	function save() {
		if (!editing || !path.trim()) return;
		updateDemo(editing.ID, path.trim());
		closeEdit();
	}

	function doDelete() {
		if (!confirmDelete) return;
		deleteDemo(confirmDelete.ID);
		setConfirmDelete(null);
		closeEdit();
	}

	return (
		<Stack spacing={1}>
			{demos.map((demo) => {
				const radar = radarFor(demo.Game?.MapName);
				const map = demo.Game?.MapName;
				const timestamp = demo.Game?.RecordedAt ?? demo.CreatedAt;
				return (
					<Card key={demo.ID}>
						<CardActionArea
							onClick={() =>
								navigate({
									to: "/demos/$demoId",
									params: { demoId: String(demo.ID) },
								})
							}
						>
							<CardContent>
								<Stack
									direction="row"
									spacing={1.5}
									sx={{
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<Stack
										direction="row"
										spacing={1.5}
										sx={{ alignItems: "center", minWidth: 0 }}
									>
										<Box
											sx={{
												width: 48,
												height: 48,
												flexShrink: 0,
												borderRadius: 1,
												bgcolor: "action.hover",
												backgroundImage: radar ? `url(${radar})` : undefined,
												backgroundSize: "cover",
												backgroundPosition: "center",
											}}
										/>
										<Stack sx={{ minWidth: 0 }}>
											<Typography noWrap>
												{formatResult(demo.Game)}
												{map ? ` — ${map}` : ""}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{formatTimestamp(timestamp)}
											</Typography>
										</Stack>
									</Stack>
									<Stack
										direction="row"
										spacing={1}
										sx={{ alignItems: "center", flexShrink: 0 }}
									>
										{!demo.Exists && (
											<Chip
												label="File missing"
												color="error"
												size="small"
												title={demo.Path}
											/>
										)}
										<IconButton
											size="small"
											onClick={(e) => {
												e.stopPropagation();
												openEdit(demo);
											}}
											aria-label="Re-point demo file"
										>
											<EditIcon fontSize="small" />
										</IconButton>
									</Stack>
								</Stack>
							</CardContent>
						</CardActionArea>
					</Card>
				);
			})}

			<Dialog open={Boolean(editing)} onClose={closeEdit} fullWidth>
				<DialogTitle>Demo file</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField
							fullWidth
							label="File path"
							value={path}
							onChange={(e) => setPath(e.target.value)}
						/>
						<Button onClick={browse}>Browse…</Button>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "space-between" }}>
					<Button
						color="error"
						onClick={() => editing && setConfirmDelete(editing)}
					>
						Delete
					</Button>
					<Stack direction="row" spacing={1}>
						<Button onClick={closeEdit}>Cancel</Button>
						<Button variant="contained" onClick={save} disabled={!path.trim()}>
							Save
						</Button>
					</Stack>
				</DialogActions>
			</Dialog>

			<Dialog
				open={Boolean(confirmDelete)}
				onClose={() => setConfirmDelete(null)}
			>
				<DialogTitle>Delete demo?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Delete this demo and its analysis? This can’t be undone. The demo
						file on disk is not affected.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
					<Button color="error" variant="contained" onClick={doDelete}>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
