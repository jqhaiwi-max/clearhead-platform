function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted ${className ?? ""}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
    </div>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Shimmer className="h-52 rounded-none" />
      <div className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Shimmer className="h-5 w-40" />
            <Shimmer className="h-4 w-28" />
          </div>
          <Shimmer className="h-8 w-16 flex-shrink-0" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-6 w-24 rounded-full" />
          <Shimmer className="h-6 w-16 rounded-full" />
          <Shimmer className="h-6 w-20 rounded-full" />
        </div>
        <div className="pt-3 border-t border-border flex justify-between items-center">
          <Shimmer className="h-6 w-20" />
          <Shimmer className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

export function AppointmentSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-start gap-4">
        <Shimmer className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <Shimmer className="h-5 w-36" />
            <Shimmer className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-20" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Shimmer className="h-3 w-12" />
          <Shimmer className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Shimmer className="h-8 w-28 rounded-xl" />
        <Shimmer className="h-8 w-20 rounded-xl" />
        <Shimmer className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function ProviderDetailSkeleton() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-6">
              <Shimmer className="w-28 h-28 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Shimmer className="h-8 w-56" />
                <Shimmer className="h-5 w-40" />
                <div className="flex gap-2">
                  <Shimmer className="h-6 w-20 rounded-full" />
                  <Shimmer className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Shimmer className="h-5 w-32" />
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-3/4" />
            </div>
          </div>
          <div className="space-y-4">
            <Shimmer className="h-48 rounded-2xl" />
            <Shimmer className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
