import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@mui/material";
import DemoHeader from "../components/DemoHeader";
import DemoList from "../components/DemoList";

export const Route = createFileRoute("/demos/")({
	component: DemosPage,
});

function DemosPage() {
	return (
		<Stack spacing={2}>
			<DemoHeader />
			<DemoList />
		</Stack>
	);
}
