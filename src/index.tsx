import React from "react";
import { I18nProvider } from "react-aria";
import { createRoot } from "react-dom/client";
import {
	BrowserRouter,
	type NavigateOptions,
	useHref,
	useNavigate,
	Routes,
	Route,
} from "react-router-dom";

import { RouterProvider } from "react-aria-components";
declare module "react-aria-components" {
	interface RouterConfig {
		routerOptions: NavigateOptions;
	}
}

import Layout from "./pages/Layout";
import Home from "./pages/Home";

import { routes } from "./utils/routes";

import "./styles/index.css";

function Navigation() {
	let navigate = useNavigate();

	return (
		<RouterProvider navigate={navigate} useHref={useHref}>
			<Routes>
				<Route element={<Layout />}>
					{[...routes.entries()].map(([key, value], index) => {
						if (index === 0) {
							return (
								<Route
									key={index}
									path={key}
									element={React.createElement(value)}
									index
								/>
							);
						}
						return <Route key={index} path={key} element={React.createElement(value)} />;
					})}
					<Route path="*" element={<Home />} />
				</Route>
			</Routes>
		</RouterProvider>
	);
}

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

const root = createRoot(container);
root.render(
	<BrowserRouter>
		<I18nProvider locale="en-US">
			<Navigation />
		</I18nProvider>
	</BrowserRouter>
);
