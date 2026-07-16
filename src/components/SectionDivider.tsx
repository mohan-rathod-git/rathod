const SectionDivider = () => (
  <div className="flex items-center gap-3 py-2">
    <div className="h-px flex-1 bg-border" />
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="text-accent">
      <circle cx="4" cy="6" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="6" r="3" fill="currentColor" />
      <circle cx="20" cy="6" r="2" fill="currentColor" opacity="0.5" />
    </svg>
    <div className="h-px flex-1 bg-border" />
  </div>
);

export default SectionDivider;
