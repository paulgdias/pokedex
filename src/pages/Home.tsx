import { preload } from "react-dom";
import { Link } from "react-router";

import { buttonClass } from "@components/Buttons/Button/utils";
import { Email, GitHub, LinkedIn } from "@components/Icons/Logos";
import Panel from "@components/Panel";

const logo: string = new URL("../images/profile.jpg", import.meta.url).href;

const Home: React.FC = () => {
    preload(logo, {
        as: "image",
    });
    return (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
            <Panel className="flex w-full max-w-md flex-col items-center gap-5 px-8 py-10 text-center">
                <img
                    alt="Portrait of Paul Dias"
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
                    className={buttonClass({ variant: "primary", size: "lg" })}
                >
                    Open the Pokédex
                </Link>
            </Panel>
        </div>
    );
};

export default Home;
