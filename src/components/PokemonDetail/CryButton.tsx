import { useEffect, useRef, useState } from "react";

import { Volume2 } from "lucide-react";
import { Button } from "react-aria-components";

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
            className={`flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-line-strong bg-surface px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                isPlaying ? "text-accent" : "text-ink"
            }`}
        >
            <Volume2 size={16} aria-hidden="true" />
            Cry
        </Button>
    );
};

export default CryButton;
