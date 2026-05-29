import { Stack } from "@mui/material";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import Sidebar from "../features/Sidebar";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<Stack direction="row" sx={{ height: "100%" }}>
			<Sidebar />
			<Stack sx={{ flex: 1, px: 6, py: 4 }}>
				<Outlet />
			</Stack>
		</Stack>
	);
}
