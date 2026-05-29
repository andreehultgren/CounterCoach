import { Publish } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { SelectDemoFiles } from "../../wailsjs/go/main/App";
import useDemos from "../hooks/useDemos";

export default function AddDemos() {
	const { addDemo } = useDemos();

	async function handleImport() {
		const files = await SelectDemoFiles();
		if (!files || files.length === 0) return;
		// Demos no longer carry a name — import each path directly; the analysis
		// (map, result, date) identifies them. Sequential so duplicate-content
		// files selected together are deduped one at a time.
		for (const path of files) await addDemo(path);
	}

	return (
		<IconButton onClick={handleImport} aria-label="Import demos">
			<Publish />
		</IconButton>
	);
}
