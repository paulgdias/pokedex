import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import Button from "@components/Buttons/Button";

const CryButton = ({ url, name }: { url: string | null; name: string }) => {
    const audio = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // a different pokémon (or none) means a different cry
    useEffect(() => {
        return () => {
            audio.current?.pause();
            audio.current = null;
            setIsPlaying(false);
        };
    }, [url]);

    const play = () => {
        if (!url) {
            return;
        }
        if (!audio.current) {
            audio.current = new Audio(url);
            audio.current.addEventListener("ended", () => setIsPlaying(false));
        }
        audio.current.currentTime = 0;
        setIsPlaying(true);
        audio.current.play().catch(() => setIsPlaying(false));
    };

    return (
        <Button
            aria-label={`Play ${name}'s cry`}
            isDisabled={!url}
            onPress={play}
            className={isPlaying ? "text-accent" : undefined}
        >
            <Volume2 size={16} aria-hidden="true" />
            Cry
        </Button>
    );
};

export default CryButton;
