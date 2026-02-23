"use client";

export default function AIPreviewPanel({
    previewUrl,
    generating,
    onGenerate,
}: {
    previewUrl: string | null;
    generating: boolean;
    onGenerate: () => void;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold">AI Preview</h4>
                <button
                    onClick={onGenerate}
                    disabled={generating}
                    className="rounded-md bg-secondary/10 px-3 py-1 text-[10px] font-medium text-secondary transition-colors hover:bg-secondary/20 disabled:opacity-50"
                >
                    {generating ? (
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                            Generating...
                        </span>
                    ) : (
                        "✨ Generate Preview"
                    )}
                </button>
            </div>

            {previewUrl ? (
                <div className="overflow-hidden rounded-lg">
                    <img
                        src={previewUrl}
                        alt="AI-generated realistic preview"
                        className="w-full"
                    />
                </div>
            ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-border text-center">
                    <div>
                        <p className="text-xs text-muted">No preview yet</p>
                        <p className="mt-1 text-[10px] text-muted/60">
                            Click &ldquo;Generate Preview&rdquo; to see a realistic mockup
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
