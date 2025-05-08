import { Outlet } from "react-router";

import Nav from "../components/Nav";

const Layout: React.FC = () => {
    return (
        <div className="flex flex-row h-dvh">
            <Nav />
            <div className={`page w-screen m-4 overflow-y-hidden"}`}>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
