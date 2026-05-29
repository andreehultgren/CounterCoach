import { createContext, type ReactNode } from "react";

import { useEffect, useState } from "react";
import {
	GetDemos,
	CreateDemo,
	UpdateDemo,
	DeleteDemo,
} from "../../wailsjs/go/main/App";
import type { models } from "../../wailsjs/go/models";

type DemoContextType = {
	demos: models.Demo[];
	addDemo: (path: string) => void;
	updateDemo: (id: number, path: string) => void;
	deleteDemo: (id: number) => void;
	updateDemos: () => void;
};

type IProps = {
	children: ReactNode;
};

const DemoContext = createContext<DemoContextType>({
	demos: [],
	addDemo: () => {},
	updateDemo: () => {},
	deleteDemo: () => {},
	updateDemos: () => {},
});

export function DemoProvider({ children }: IProps) {
	const [demos, setDemos] = useState<models.Demo[]>([]);

	function updateDemos() {
		GetDemos().then(setDemos);
	}

	function addDemo(path: string) {
		CreateDemo(path).then(updateDemos);
	}

	function updateDemo(id: number, path: string) {
		UpdateDemo(id, path).then(updateDemos);
	}

	function deleteDemo(id: number) {
		DeleteDemo(id).then(updateDemos);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: updateDemos is ok
	useEffect(() => {
		updateDemos();
	}, []);
	return (
		<DemoContext.Provider
			value={{ demos, addDemo, updateDemo, deleteDemo, updateDemos }}
		>
			{children}
		</DemoContext.Provider>
	);
}

export default DemoContext;
