import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

export default function ColorModeToggle() {
	const { mode, setMode } = useColorScheme();

	// `mode` is undefined on the very first render — render a stable placeholder.
	if (!mode) {
		return (
			<IconButton disabled sx={{ color: "text.secondary" }}>
				<DarkModeIcon />
			</IconButton>
		);
	}

	const isDark = mode === "dark";
	return (
		<Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
			<IconButton
				onClick={() => setMode(isDark ? "light" : "dark")}
				sx={{ color: "text.secondary" }}
			>
				{isDark ? <LightModeIcon /> : <DarkModeIcon />}
			</IconButton>
		</Tooltip>
	);
}
