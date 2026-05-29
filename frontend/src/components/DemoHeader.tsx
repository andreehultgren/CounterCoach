import useDemos from "../hooks/useDemos";
import { IconButton, Stack, Typography } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import AddDemos from "./AddDemos";

export default function DemoHeader() {
	const { updateDemos } = useDemos();

	return (
		<Stack direction="row" sx={{ justifyContent: "space-between" }} spacing={2}>
			<Stack direction="row">
				<Typography variant="h3">Demos</Typography>
				<IconButton onClick={updateDemos}>
					<Refresh />
				</IconButton>
			</Stack>
			<AddDemos />
		</Stack>
	);
}
