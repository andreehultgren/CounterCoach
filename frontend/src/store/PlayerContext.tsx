import {
	createContext,
	type ReactNode,
	useCallback,
	useEffect,
	useState,
} from "react";
import {
	GetPlayerProfile,
	GetPlayers,
	SetPlayerName,
} from "../../wailsjs/go/main/App";
import type { models } from "../../wailsjs/go/models";
import { EventsOn } from "../../wailsjs/runtime/runtime";

type PlayerContextType = {
	players: models.PlayerListItem[];
	updatePlayers: () => void;
	// Rename a player (blank reverts to the in-game name), then refresh the list.
	// Resolves once persisted so callers can chain their own refetch.
	renamePlayer: (steamID: string, name: string) => Promise<void>;
	// Passthrough for the per-player profile (parameterized, not cached here).
	getProfile: (steamID: string) => Promise<models.PlayerProfile>;
};

type IProps = {
	children: ReactNode;
};

const PlayerContext = createContext<PlayerContextType>({
	players: [],
	updatePlayers: () => {},
	renamePlayer: async () => {},
	getProfile: () => Promise.resolve({} as models.PlayerProfile),
});

export function PlayerProvider({ children }: IProps) {
	const [players, setPlayers] = useState<models.PlayerListItem[]>([]);

	const updatePlayers = useCallback(() => {
		GetPlayers().then(setPlayers);
	}, []);

	const renamePlayer = useCallback(
		async (steamID: string, name: string) => {
			await SetPlayerName(steamID, name);
			updatePlayers();
		},
		[updatePlayers],
	);

	const getProfile = useCallback(
		(steamID: string) => GetPlayerProfile(steamID),
		[],
	);

	useEffect(() => {
		updatePlayers();
		// Analyzing a demo creates/updates player rows — refresh when one lands.
		const off = EventsOn("demo:analyzed", () => updatePlayers());
		return off;
	}, [updatePlayers]);

	return (
		<PlayerContext.Provider
			value={{ players, updatePlayers, renamePlayer, getProfile }}
		>
			{children}
		</PlayerContext.Provider>
	);
}

export default PlayerContext;
