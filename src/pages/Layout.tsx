import { Outlet } from "react-router";

import Nav from "../components/Nav";
import { ErrorBoundary } from "react-error-boundary";

const Layout: React.FC = () => {
    return (
        <div className="flex flex-row h-dvh">
            <Nav />
            <div className="page w-screen m-4 overflow-y-hidden">
                <ErrorBoundary
                    fallback={
                        <div>
                            There was an error loading the page. Please try
                            again.
                        </div>
                    }
                >
                    <Outlet />
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default Layout;
