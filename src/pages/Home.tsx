import { preload } from "react-dom";
import { Link } from "react-router";

import { Email, GitHub, LinkedIn } from "@components/Icons/Logos";

const logo: string = new URL("../images/profile.jpg", import.meta.url).href;

const Home: React.FC = () => {
    preload(logo, {
        as: "image",
    });
    return (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
            <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-line bg-surface px-8 py-10 text-center">
                <img
                    title="Profile Picture"
                    alt="Profile Picture"
                    className="size-32 rounded-full bg-sand object-contain"
                    src={logo}
                />
                <div>
                    <h1 className="font-display text-4xl leading-tight font-bold tracking-tight">
                        Paul Dias
                    </h1>
                    <div className="mt-1 text-[15px] text-muted">
                        Pokémon Trainer
                    </div>
                </div>
                <div className="flex flex-row items-center gap-4">
                    <LinkedIn />
                    <GitHub />
                    <Email />
                </div>
                <Link
                    to="/pokedex"
                    className="flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white"
                >
                    Open the Pokédex
                </Link>
            </div>
        </div>
    );
};

export default Home;
