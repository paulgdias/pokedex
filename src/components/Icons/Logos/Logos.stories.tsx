import type { Meta } from "@storybook/react-vite";
import type { StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Email, GitHub, LinkedIn, githubUrl, linkedinUrl } from ".";

const Links = () => (
    <div className="flex gap-4">
        <GitHub width={32} height={32} />
        <LinkedIn width={32} height={32} />
        <Email width={32} height={32} />
    </div>
);

const meta = {
    title: "Shared/Icons/Logos",
    component: Links,
} satisfies Meta<typeof Links>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SocialLinks: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const github = canvas.getByRole("link", { name: "GitHub" });
        const linkedin = canvas.getByRole("link", { name: "LinkedIn" });
        const email = canvas.getByRole("link", { name: "Email" });

        await expect(github).toHaveAttribute("href", githubUrl);
        await expect(linkedin).toHaveAttribute("href", linkedinUrl);
        await expect(email.getAttribute("href")).toMatch(/^mailto:/);
        // links that leave the site must not expose window.opener
        for (const link of [github, linkedin, email]) {
            await expect(link).toHaveAttribute("target", "_blank");
            await expect(link).toHaveAttribute(
                "rel",
                expect.stringContaining("noopener")
            );
        }
    },
};
