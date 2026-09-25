import { Monitor, Moon, Sun } from "lucide-react";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";

import { ThemePreference, useTheme } from "@utils/useTheme";

const OPTIONS = [
    { id: "light", label: "Light theme", Icon: Sun },
    { id: "system", label: "System theme", Icon: Monitor },
    { id: "dark", label: "Dark theme", Icon: Moon },
] as const;

const ThemeToggle = () => {
    const { preference, setPreference } = useTheme();

    return (
        <ToggleButtonGroup
            aria-label="Theme"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[preference]}
            onSelectionChange={(keys) => {
                const [id] = Array.from(keys);
                setPreference(id as ThemePreference);
            }}
            className="flex w-fit gap-0.5 rounded-xl bg-sidebar-hover p-[3px]"
        >
            {OPTIONS.map(({ id, label, Icon }) => (
                <ToggleButton
                    key={id}
                    id={id}
                    aria-label={label}
                    className={({ isSelected }) =>
                        `flex size-9 cursor-pointer items-center justify-center rounded-[9px] focus-visible:-outline-offset-2 ${
                            isSelected
                                ? "bg-sidebar-active text-white"
                                : "text-sidebar-muted hover:text-white"
                        }`
                    }
                >
                    <Icon size={16} aria-hidden="true" />
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
};

export default ThemeToggle;
