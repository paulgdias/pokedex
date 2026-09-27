import { ArrowUp } from "lucide-react";
import { Button } from "react-aria-components";

const ScrollTopButton = ({ onPress }: { onPress: () => void }) => (
    <Button
        aria-label="Go to Top of Page"
        className="fixed right-6 bottom-6 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full bg-ink text-paper shadow-fab transition-transform duration-200 hover:scale-105"
        onPress={onPress}
    >
        <ArrowUp size={20} />
    </Button>
);

export default ScrollTopButton;
