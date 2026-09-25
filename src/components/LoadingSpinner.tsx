import Pokeball from "@components/Icons/Pokeball";

const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center h-screen animate-spin">
            <Pokeball width={52} height={52} />
        </div>
    );
};

export default LoadingSpinner;
