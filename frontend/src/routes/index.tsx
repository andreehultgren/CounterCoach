import { createFileRoute } from "@tanstack/react-router";
import { Stack, Typography } from "@mui/material";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<Stack spacing={1}>
			<Typography variant="h3">CounterCoach</Typography>
			<Typography variant="body1" color="text.secondary">
				Select a section from the sidebar.
			</Typography>
		</Stack>
	);
}
