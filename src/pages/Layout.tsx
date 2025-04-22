import React from "react";
import { Outlet, useLocation } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Nav from "../components/Nav";

import { routes } from "../utils/routes";

const Layout: React.FC = () => {
	const location = useLocation();
	const basePathname = `/${location.pathname.split("/")[1]}`
	const defaultSelected = routes.get(basePathname)?.name || "Home";
	const [selected, setSelected] = React.useState<string>(defaultSelected);
	
	const handleSelect = (item: string): void => {
		setSelected(item);
	};

	// Create a client
	const queryClient = new QueryClient();

	return (
		<div className="flex flex-row h-dvh">
			<Nav selected={selected} onSelect={handleSelect} />
			<div className="page w-screen p-4 overflow-y-auto">
				<QueryClientProvider client={queryClient}>
					<Outlet />
				</QueryClientProvider>
			</div>
		</div>
	);
};

export default Layout;
