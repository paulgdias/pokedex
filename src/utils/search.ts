import { PokemonDetails } from "@customTypes/PokemonTypes";
import { SearchFields } from "@customTypes/SortingTypes";

export const searchRegex = /\+([^=]+)=([^ ]+)/g;

export const basicSearch = (
    data: PokemonDetails[],
    search: string
): PokemonDetails[] => {
    const searchResults = data.filter((item) => {
        const number = Number(search);
        if (isNaN(number)) {
            return item.name.includes(search.toLowerCase());
        }
        return item._id === number;
    });
    return searchResults;
};

export const advancedSearch = (
    data: PokemonDetails[],
    search: string
): PokemonDetails[] => {
    const match = [...search.matchAll(searchRegex)];
    if (match.length > 0) {
        let searchResults: PokemonDetails[] = data;
        match.forEach((match) => {
            const filter = match[1] as keyof SearchFields;
            const value = match[2];
            searchResults = searchResults.filter((item) => {
                let exists = false;
                switch (filter) {
                    case "name":
                    case "pokemon":
                        exists = item["name"] === value;
                        break;
                    case "id":
                    case "number":
                        exists = item["_id"] === Number(value);
                        break;
                    case "type":
                        exists = item["types"].some((type) => type === value);
                        break;
                    case "isLegendary":
                    case "legends":
                        exists = item["isLegendary"] === Boolean(value);
                        break;
                    case "isMythical":
                    case "mythicals":
                        exists = item["isMythical"] === Boolean(value);
                        break;
                    case "gen":
                    case "generation":
                        exists = item["generationId"] === Number(value);
                        break;
                    default:
                        break;
                }
                return exists;
            });
        });
        return searchResults;
    }

    return basicSearch(data, search);
};

export const createURLSearchParams = (
    searches?: RegExpExecArray[]
): URLSearchParams => {
    const params = new URLSearchParams();
    if (searches) {
        let searchString = "";
        searches.forEach((item, index, array) => {
            searchString += `${item[1]}:${item[2]}`;
            if (index !== array.length - 1) {
                searchString += ",";
            }
        });
        if (searchString) {
            params.set("query", searchString);
        }
    }
    return params;
};

export const convertToSearch = (urlParams: URLSearchParams) => {
    let search = "";
    const query = urlParams.get("query");
    if (query) {
        const searches = query.split(",");
        searches.forEach((pair) => {
            const [key, value] = pair.split(":");
            search += `+${key}=${value} `;
        });
    }
    return search;
};
