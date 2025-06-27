import { useState } from "react";
import { NavLink } from "react-router";
import { Button } from "react-aria-components";

import {
    House,
    LibraryBig,
    ChevronsLeft,
    ChevronsRight,
    FolderHeart,
} from "lucide-react";

const hoverShadow = "hover:drop-shadow-md hover:drop-shadow-sky-400";
const iconStyle = "h-6 w-6 text-white";

const Nav: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleWidth = isOpen ? "w-40" : "w-10";
    const toggleDisplay = isOpen ? "block" : "hidden";

    return (
        <>
            {/* Navigation Links */}
            <div className={`flex ${toggleWidth} transition-all duration-300`}>
                <nav
                    className={`grid gap-4 bg-gray-800 p-2 w-full content-start`}
                >
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `react-aria-Button flex flex-row items-end ${hoverShadow} ${isActive ? "active" : ""}`
                        }
                        aria-label="Home"
                        onClick={() => {
                            if (isOpen) setIsOpen(false);
                        }}
                    >
                        <House className={`${iconStyle} cursor-pointer`} />
                        <span className={`text-white ml-2 ${toggleDisplay}`}>
                            Home
                        </span>
                    </NavLink>
                    <NavLink
                        to="/pokedex"
                        className={({ isActive }) =>
                            `react-aria-Button flex flex-row items-end ${hoverShadow} ${isActive ? "active" : ""}`
                        }
                        aria-label="pokedev"
                        onClick={() => {
                            if (isOpen) setIsOpen(false);
                        }}
                    >
                        <LibraryBig className={`${iconStyle} cursor-pointer`} />
                        <span className={`text-white ml-2 ${toggleDisplay}`}>
                            Pokédex
                        </span>
                    </NavLink>
                    <NavLink
                        to="/teams"
                        className={(
                            { isActive } // hide since it requires the mongodb API
                        ) =>
                            `react-aria-Button hidden flex-row items-end ${hoverShadow} ${isActive ? "active" : ""}`
                        }
                        aria-label="teams"
                        onClick={() => {
                            if (isOpen) setIsOpen(false);
                        }}
                    >
                        <FolderHeart
                            className={`${iconStyle} cursor-pointer`}
                        />
                        <span className={`text-white ml-2 ${toggleDisplay}`}>
                            Teams
                        </span>
                    </NavLink>
                </nav>
            </div>

            {/* Toggle Button */}
            <nav
                className={`grid gap-4 bg-gray-700 max-sm:hidden max-sm:invisible`}
            >
                <Button
                    aria-label={isOpen ? "Collapse Menu" : "Expand Menu"}
                    className="text-white cursor-pointer hover:bg-gray-600"
                    onPress={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <ChevronsLeft className={iconStyle} />
                    ) : (
                        <ChevronsRight className={iconStyle} />
                    )}
                </Button>
            </nav>
        </>
    );
};

export default Nav;
