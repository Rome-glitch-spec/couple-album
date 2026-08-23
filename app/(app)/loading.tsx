export default function Loading() {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-3 text-ink-soft">
        <div className="h-8 w-8 rounded-full border-2 border-line border-t-wine animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}
