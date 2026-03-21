import { Bell, Search, User } from 'lucide-react'

export function Header() {
  return (
    <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 bg-accent/50 px-3 py-1.5 rounded-full w-full max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search incidents, users, reports..." 
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-accent transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="text-right">
            <p className="text-sm font-medium">DMC Officer</p>
            <p className="text-xs text-muted-foreground">Colombo District</p>
          </div>
          <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  )
}
