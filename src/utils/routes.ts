import Home from "../pages/Home";
import Pokedex from "../pages/Pokedex";
import Pokemon from "../pages/Pokemon";

export const routes = new Map<string, React.FC>([
    ["/", Home],
    ["/pokedex", Pokedex as React.FC],
    ["/pokedex/:pokemon", Pokemon as React.FC],
]);
