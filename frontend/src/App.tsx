import { RouterProvider, createRouter } from "@tanstack/react-router";
import { DemoProvider } from "./store/DemoContext";
import { PlayerProvider } from "./store/PlayerContext";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function App() {
	return (
		<DemoProvider>
			<PlayerProvider>
				<RouterProvider router={router} />
			</PlayerProvider>
		</DemoProvider>
	);
}

export default App;
