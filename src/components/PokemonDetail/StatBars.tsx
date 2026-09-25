import { MAX_STAT, STAT_LABELS } from "@utils/stats";

const StatBars = ({ stats, total }: { stats: number[]; total: number }) => (
    <dl className="flex flex-col gap-2.5">
        {STAT_LABELS.map((label, index) => {
            const value = stats[index] ?? 0;

            return (
                <div
                    key={label}
                    className="grid grid-cols-[4.5rem_1fr] items-center gap-3"
                >
                    <dt className="text-sm text-muted">{label}</dt>
                    <dd className="flex items-center gap-3">
                        <span className="w-9 text-right font-mono text-sm font-semibold">
                            {value}
                        </span>
                        <div
                            role="meter"
                            aria-label={label}
                            aria-valuemin={0}
                            aria-valuemax={MAX_STAT}
                            aria-valuenow={value}
                            className="h-2 flex-1 overflow-hidden rounded-full bg-track"
                        >
                            <div
                                className="h-full rounded-full bg-accent"
                                style={{
                                    width: `${(Math.min(value, MAX_STAT) / MAX_STAT) * 100}%`,
                                }}
                            />
                        </div>
                    </dd>
                </div>
            );
        })}
        <div className="grid grid-cols-[4.5rem_1fr] items-center gap-3 border-t border-line pt-2.5">
            <dt className="text-sm font-semibold">Total</dt>
            <dd className="w-9 text-right font-mono text-sm font-bold">
                {total}
            </dd>
        </div>
    </dl>
);

export default StatBars;
