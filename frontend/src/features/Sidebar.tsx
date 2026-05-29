import { Box, Stack } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";
import SidebarLink from "../components/SidebarLink";
import ColorModeToggle from "../components/ColorModeToggle";

export default function Sidebar() {
	return (
		<Stack
			direction="column"
			sx={{
				bgcolor: "background.paper",
				borderRight: 1,
				borderColor: "divider",
				height: "100%",
				alignItems: "center",
			}}
		>
			<SidebarLink icon={<HomeIcon />} to="/" />
			<SidebarLink icon={<OndemandVideoIcon />} to="/demos" />
			<SidebarLink icon={<PeopleIcon />} to="/players" />
			<SidebarLink icon={<SettingsIcon />} to="/settings" />
			<SidebarLink icon={<InfoIcon />} to="/about" />

			{/* push the toggle to the bottom */}
			<Box sx={{ flexGrow: 1 }} />
			<Box sx={{ py: 2 }}>
				<ColorModeToggle />
			</Box>
		</Stack>
	);
}
