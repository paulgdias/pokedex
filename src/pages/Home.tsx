import React from "react";
import { preload } from "react-dom";

import { LinkedIn, GitHub, Email } from "@components/Icons/Logos";

const logo: string = new URL("../images/profile.jpg", import.meta.url).href;

const Home: React.FC = () => {
    preload(logo, {
        as: "image",
    });
    return (
        <>
            <div className="flex flex-col items-center justify-center">
                <div className="text-xl sm:text-4xl font-bold font-stretch-expanded mt-4">
                    Paul Dias
                </div>
                <img
                    title="Profile Picture"
                    alt="Profile Picture"
                    tabIndex={0}
                    className="object-contain size-32 rounded-full bg-black m-4"
                    src={logo}
                />
                <div className="text-lg sm:text-2xl font-bold font-stretch-expanded">
                    Pokémon Trainer
                </div>
                <div className="flex flex-row space-x-4 mt-4">
                    <LinkedIn />
                    <GitHub />
                    <Email />
                </div>
            </div>
        </>
    );
};

export default Home;
