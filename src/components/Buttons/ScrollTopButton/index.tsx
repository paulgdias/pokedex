import { ArrowUp } from "lucide-react";

import Button from "../Button";

const ScrollTopButton = ({ onPress }: { onPress: () => void }) => (
    <Button
        aria-label="Go to Top of Page"
        variant="primary"
        size="lg"
        icon
        className="fixed right-6 bottom-6 z-10 rounded-full shadow-fab transition-transform duration-200 hover:scale-105"
        onPress={onPress}
    >
        <ArrowUp size={20} />
    </Button>
);

export default ScrollTopButton;
