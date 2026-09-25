export type PokedexView = "cards" | "list";

const VIEW_PARAM = "view";

export const getViewFromURLParams = (params: URLSearchParams): PokedexView =>
    params.get(VIEW_PARAM) === "list" ? "list" : "cards";

/** Returns a copy of `params` with the view applied (cards is the default). */
export const withView = (
    params: URLSearchParams,
    view: PokedexView
): URLSearchParams => {
    const next = new URLSearchParams(params);
    if (view === "list") {
        next.set(VIEW_PARAM, view);
    } else {
        next.delete(VIEW_PARAM);
    }
    return next;
};
