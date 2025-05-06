import React, { useState } from "react";
import { Button, Link } from "react-aria-components";

import { House, LibraryBig, ChevronsLeft, ChevronsRight } from "lucide-react";

const hoverShadow = "hover:drop-shadow-md hover:drop-shadow-sky-400";
const iconStyle = "h-6 w-6 text-white";

interface NavProps {
    selected: string;
    onSelect: (selection: string) => void;
}

const Nav: React.FC<NavProps> = ({ selected, onSelect }) => {
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
                    <Link
                        href="/"
                        className={`react-aria-Button flex flex-row items-end ${hoverShadow}`}
                        aria-label="Home"
                        onPress={() => {
                            if (isOpen) setIsOpen(false);
                            onSelect("Home");
                        }}
                    >
                        <House
                            className={`${iconStyle} cursor-pointer ${selected === "Home" ? "border-b-2 border-sky-500" : ""}`}
                        />
                        <span className={`text-white ml-2 ${toggleDisplay}`}>
                            Home
                        </span>
                    </Link>
                    <Link
                        href="/pokedex"
                        className={`react-aria-Button flex flex-row items-end ${hoverShadow}`}
                        aria-label="pokedev"
                        onPress={() => {
                            if (isOpen) setIsOpen(false);
                            onSelect("Pokedex");
                        }}
                    >
                        <LibraryBig
                            className={`${iconStyle} cursor-pointer ${selected === "Pokedex" ? "border-b-2 border-sky-500" : ""}`}
                        />
                        <span className={`text-white ml-2 ${toggleDisplay}`}>
                            Pokédex
                        </span>
                    </Link>
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
