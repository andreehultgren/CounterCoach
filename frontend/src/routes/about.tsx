import { createFileRoute } from "@tanstack/react-router";
import { Stack, Typography } from "@mui/material";
import useDemos from "../hooks/useDemos";

export const Route = createFileRoute("/about")({
	component: AboutPage,
});

function AboutPage() {
	const { demos } = useDemos();
	return (
		<Stack spacing={1}>
			<Typography variant="h3">About</Typography>
			<Typography variant="body1" color="text.secondary">
				CounterCoach — demo analysis tool.
			</Typography>
			<Typography>We have found {demos.length} games</Typography>
		</Stack>
	);
}
