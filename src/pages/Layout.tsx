import React from "react";
import { Outlet } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Nav from "../components/Nav";

const Layout: React.FC = () => {
    // Create a client
    const queryClient = new QueryClient();

    return (
        <div className="flex flex-row h-dvh">
            <Nav />
            <div className={`page w-screen m-4 overflow-y-hidden"}`}>
                <QueryClientProvider client={queryClient}>
                    <Outlet />
                </QueryClientProvider>
            </div>
        </div>
    );
};

export default Layout;
