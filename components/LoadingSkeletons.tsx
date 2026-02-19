export function FileSkeleton() {
  return (
    <div className="glass rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-700" />
          <div className="min-w-0">
            <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-600 rounded" />
          </div>
        </div>
      </div>
      <div className="h-3 w-20 bg-gray-700 rounded mb-4" />
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-gray-700 rounded" />
        <div className="w-9 h-9 bg-gray-700 rounded" />
      </div>
    </div>
  )
}

export function FileGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <FileSkeleton key={i} />
      ))}
    </div>
  )
}

export function HeaderSkeleton() {
  return (
    <div className="glass border-b border-border sticky top-0 z-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div>
            <div className="h-8 w-32 bg-gray-700 rounded mb-2" />
            <div className="h-4 w-40 bg-gray-600 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-32 bg-gray-700 rounded" />
            <div className="h-10 w-24 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmailBannerSkeleton() {
  return (
    <div className="mb-6 glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-gray-700 rounded mt-0.5" />
        <div className="flex-1">
          <div className="h-4 w-48 bg-gray-700 rounded mb-2" />
          <div className="h-3 w-full bg-gray-600 rounded mb-3" />
          <div className="flex gap-2">
            <div className="flex-1 h-9 bg-gray-700 rounded" />
            <div className="w-16 h-9 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PreferencesPanelSkeleton() {
  return (
    <div className="mb-8 glass rounded-xl p-6 border border-border animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-700 rounded" />
          <div className="h-6 w-32 bg-gray-700 rounded" />
        </div>
        <div className="h-9 w-24 bg-gray-700 rounded" />
      </div>

      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
            <div>
              <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
              <div className="h-3 w-48 bg-gray-600 rounded" />
            </div>
            <div className="h-7 w-12 bg-gray-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function UploadSectionSkeleton() {
  return (
    <div className="mb-8">
      <div className="glass rounded-2xl p-12 border-2 border-dashed border-border animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-700" />
          <div className="text-center">
            <div className="h-6 w-32 bg-gray-700 rounded mb-2 mx-auto" />
            <div className="h-4 w-48 bg-gray-600 rounded mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
