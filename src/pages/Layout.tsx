import { Outlet } from "react-router";

import { ErrorBoundary } from "react-error-boundary";
import Nav from "../components/Nav";

import { Toaster } from "sonner";

import { useTheme } from "@utils/useTheme";

const Layout: React.FC = () => {
    const { resolved } = useTheme();

    return (
        <div className="flex h-dvh flex-col bg-paper text-ink lg:flex-row">
            <Nav />
            <Toaster richColors position="bottom-left" theme={resolved} />
            <main className="page flex min-h-0 min-w-0 flex-1 flex-col">
                <ErrorBoundary
                    fallback={
                        <div className="p-8">
                            There was an error loading the page. Please try
                            again.
                        </div>
                    }
                >
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    );
};

export default Layout;
