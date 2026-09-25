import {
    Link,
    NavLink,
    useLocation,
    useRouteLoaderData,
    useSearchParams,
} from "react-router";

import { FolderHeart, House, LibraryBig } from "lucide-react";

import Pokeball from "@components/Icons/Pokeball";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import { GENERATIONS, countByGeneration } from "@utils/generations";
import { getFiltersFromURLParams, withFilters } from "@utils/search";

const NAV_ITEMS = [
    { to: "/", label: "Home", Icon: House, hidden: false },
    { to: "/pokedex", label: "Pokédex", Icon: LibraryBig, hidden: false },
    // hidden since it requires the mongodb API
    { to: "/teams", label: "Teams", Icon: FolderHeart, hidden: true },
].filter(({ hidden }) => !hidden);

// focus outline is drawn inside: outside it is clipped by the scrolling list
// and overlaps neighbouring rows
const rowClass =
    "flex min-h-11 w-full items-center rounded-[10px] px-3 text-left text-sm focus-visible:-outline-offset-2";

const Logo = () => (
    <div className="flex items-center gap-2.5 px-2 py-1">
        <Pokeball width={32} height={32} />
        <div className="font-display text-xl font-bold tracking-tight">
            Pokédex
        </div>
    </div>
);

const GenerationList = () => {
    const [params] = useSearchParams();
    // filters only apply to the list, not to a single pokémon's page
    const isList = useLocation().pathname === "/pokedex";
    // both routes load the same pokédex data
    const pokedex = useRouteLoaderData("pokedex");
    const pokemonPage = useRouteLoaderData("pokemon");
    const pokemon = (pokedex ?? pokemonPage) as PokemonDetails[] | undefined;

    const filters = getFiltersFromURLParams(params);
    const counts = countByGeneration(pokemon ?? []);

    const rows = [
        {
            id: null,
            roman: "All",
            region: "Every region",
            count: pokemon?.length ?? 0,
        },
        ...GENERATIONS.map((generation) => ({
            id: generation.id,
            roman: generation.roman,
            region: generation.region,
            count: counts.get(generation.id) ?? 0,
        })),
    ];

    return (
        <div className="flex min-h-0 grow flex-col gap-1.5">
            <div className="px-3 pb-1 text-[11px] font-bold tracking-[0.12em] text-sidebar-label uppercase">
                Generations
            </div>
            <div className="flex flex-col gap-0.5 overflow-y-auto">
                {rows.map(({ id, roman, region, count }) => {
                    const isActive = isList && filters.generation === id;
                    const search = withFilters(params, {
                        ...filters,
                        generation: id,
                    }).toString();
                    return (
                        <Link
                            key={roman}
                            to={{
                                pathname: "/pokedex",
                                search: search ? `?${search}` : "",
                            }}
                            preventScrollReset
                            aria-current={isActive ? "true" : undefined}
                            className={`${rowClass} justify-between hover:bg-sidebar-hover ${
                                isActive
                                    ? "bg-sidebar-active text-white"
                                    : "text-sidebar-text"
                            }`}
                        >
                            <span className="flex items-baseline gap-2.5">
                                <span className="w-[26px] font-mono text-xs text-sidebar-muted">
                                    {roman}
                                </span>
                                <span className="font-semibold">{region}</span>
                            </span>
                            <span className="font-mono text-[11px] text-sidebar-muted">
                                {count}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const Nav: React.FC = () => {
    const location = useLocation();
    const onPokedex = location.pathname.startsWith("/pokedex");

    const toWithPreservedSearch = (to: string) => ({
        pathname: to,
        search: location.pathname === to ? location.search : "",
    });

    return (
        <>
            {/* below lg: a compact top bar */}
            <header className="flex shrink-0 items-center justify-between bg-sidebar px-4 py-2.5 text-[#f3f0e8] lg:hidden">
                <Logo />
                <nav aria-label="Primary" className="flex gap-1">
                    {NAV_ITEMS.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={toWithPreservedSearch(to)}
                            end={to === "/"}
                            aria-label={label}
                            className={({ isActive }) =>
                                `flex size-11 items-center justify-center rounded-[10px] hover:bg-sidebar-hover focus-visible:-outline-offset-2 ${
                                    isActive ? "bg-sidebar-active" : ""
                                }`
                            }
                        >
                            <Icon size={20} />
                        </NavLink>
                    ))}
                </nav>
            </header>

            <aside className="hidden w-66 shrink-0 flex-col gap-6 bg-sidebar px-3.5 py-5 text-[#f3f0e8] lg:flex">
                <Logo />
                <nav aria-label="Primary" className="flex flex-col gap-0.5">
                    {NAV_ITEMS.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={toWithPreservedSearch(to)}
                            end={to === "/"}
                            className={({ isActive }) =>
                                `${rowClass} gap-3 font-semibold hover:bg-sidebar-hover ${
                                    isActive
                                        ? "bg-sidebar-active text-white"
                                        : "text-sidebar-text"
                                }`
                            }
                        >
                            <Icon size={18} aria-hidden="true" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
                {onPokedex && <GenerationList />}
            </aside>
        </>
    );
};

export default Nav;
