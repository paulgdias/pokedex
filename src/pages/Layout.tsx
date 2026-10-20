import { lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation, useNavigation } from "react-router";

import LoadingSpinner from "../components/LoadingSpinner";
import Nav from "../components/Nav";

const Toaster = lazy(() =>
    import("sonner").then((module) => ({ default: module.Toaster }))
);

import { useTheme } from "@utils/useTheme";

const Layout: React.FC = () => {
    const { resolved } = useTheme();
    const navigation = useNavigation();
    const { pathname } = useLocation();
    const isNavigating =
        navigation.state === "loading" &&
        navigation.location.pathname !== pathname;

    return (
        <div className="flex h-dvh flex-col bg-paper text-ink lg:flex-row">
            <Nav />
            <Suspense fallback={null}>
                <Toaster richColors position="bottom-left" theme={resolved} />
            </Suspense>
            <main
                className="page relative flex min-h-0 min-w-0 flex-1 flex-col"
                aria-busy={isNavigating}
            >
                {isNavigating && (
                    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-paper/60 transition-opacity delay-200 duration-200 starting:opacity-0">
                        <LoadingSpinner className="h-auto" />
                    </div>
                )}
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
