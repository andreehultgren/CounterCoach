import { createFileRoute } from "@tanstack/react-router";
import { Stack, Typography } from "@mui/material";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<Stack spacing={1}>
			<Typography variant="h3">Settings</Typography>
			<Typography variant="body1" color="text.secondary">
				Settings go here.
			</Typography>
		</Stack>
	);
}
