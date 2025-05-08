import {
    ArrowUpNarrowWide, // asc
    ArrowDownWideNarrow, // desc
} from "lucide-react";

import { Sort } from "@customTypes/SortingTypes";

const SortingArrow = ({ sort }: { sort: Sort }) => {
    if (sort === "asc") {
        return <ArrowUpNarrowWide />;
    }

    return <ArrowDownWideNarrow />;
};

export default SortingArrow;
