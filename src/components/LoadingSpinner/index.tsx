import { twMerge } from "tailwind-merge";

import Pokeball from "@components/Icons/Pokeball";

const LoadingSpinner = ({ className }: { className?: string }) => {
    return (
        <div
            role="status"
            aria-label="Loading"
            className={twMerge(
                "flex justify-center items-center h-screen animate-spin",
                className
            )}
        >
            <Pokeball width={52} height={52} />
        </div>
    );
};

export default LoadingSpinner;
