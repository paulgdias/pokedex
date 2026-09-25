import { Outlet } from "react-router";

import Nav from "../components/Nav";
import { ErrorBoundary } from "react-error-boundary";

import { Toaster } from "sonner";

const Layout: React.FC = () => {
    return (
        <div className="flex h-dvh flex-col bg-paper text-ink lg:flex-row">
            <Nav />
            <Toaster richColors position="bottom-left" />
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
