import { Menu, LogOut, Loader2, UserCheck } from 'lucide-react'

export default function AdminHeader({
  adminEmail,
  onOpenMobile,
  onLogout,
  isLoggingOut,
  title = 'Console',
}) {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-white">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side: Admin Email Pill & Logout */}
      <div className="flex items-center gap-3">
        {adminEmail && (
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
            <UserCheck className="w-3.5 h-3.5 text-orange-400" />
            <span className="truncate max-w-[180px]">{adminEmail}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
              <span>Exiting...</span>
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5 text-orange-400" />
              <span>Logout</span>
            </>
          )}
        </button>
      </div>
    </header>
  )
}
