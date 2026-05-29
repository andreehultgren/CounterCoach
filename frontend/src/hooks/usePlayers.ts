import { useContext } from "react";
import PlayerContext from "../store/PlayerContext";

export default function usePlayers() {
	return useContext(PlayerContext);
}
