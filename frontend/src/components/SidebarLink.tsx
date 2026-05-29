import { Stack } from "@mui/material";
import { Link } from "@tanstack/react-router";
import React from "react";

type Props = {
	icon: React.ReactNode;
	to: string;
};

export default function SidebarLink({ icon, to }: Props) {
	return (
		<Link to={to} style={{ textDecoration: "none" }}>
			{({ isActive }) => (
				<Stack
					direction="row"
					sx={{
						width: 50,
						height: 50,
						justifyContent: "center",
						alignItems: "center",
						color: isActive ? "primary.main" : "text.secondary",
						bgcolor: isActive ? "action.selected" : "transparent",
						transition: (theme) =>
							theme.transitions.create(["background-color", "color"]),
						"&:hover": { bgcolor: "action.hover" },
					}}
				>
					{icon}
				</Stack>
			)}
		</Link>
	);
}
