import { Bell, Search } from 'lucide-react'

export function Header() {
  return (
    <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">

        <div className="hidden md:flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-xl w-96 border border-transparent focus-within:border-primary/20 focus-within:bg-card transition-all group">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search incidents, alerts, volunteers..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2.5 rounded-xl hover:bg-muted transition-all border border-transparent active:scale-95">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
        </button>

        <div className="flex items-center gap-4 pl-6 border-l border-border/60">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">DMC Officer</p>
            <p className="text-[11px] text-muted-foreground font-medium">Region 3 - Colombo</p>
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-primary/20">
            DO
          </div>
        </div>
      </div>
    </header>
  )
}
