import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/demos")({
	component: DemosLayout,
});

function DemosLayout() {
	return <Outlet />;
}
