type HeaderBrandingProps = {
  siteName?: string | null
  tagline?: string | null
}

export function HeaderBranding({ siteName, tagline }: HeaderBrandingProps) {
  if (siteName || tagline) {
    return (
      <div className="hidden sm:flex flex-col min-w-0 max-w-[220px]">
        {tagline && (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 truncate">{tagline}</p>
        )}
        {siteName && (
          <h1 className="text-lg font-semibold text-slate-900 truncate" title={siteName}>
            {siteName} Workspace
          </h1>
        )}
      </div>
    )
  }

  return (
    <div className="hidden sm:flex flex-col">
      <div className="h-3 w-20 bg-slate-100 rounded animate-pulse mb-1" />
      <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
    </div>
  )
}
