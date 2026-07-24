import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, FileText, Map, AlertTriangle, Users, Box, MapPin, Ticket,
  HeartHandshake, HelpCircle, Activity, Shield, Droplet, Settings,
  Navigation, Home, AlertCircle, Phone, UserSearch, Zap, ArrowRight,
  Loader2, TrendingUp, BarChart2, Brain, Tent, Gift,
} from "lucide-react";
import {
  incidentService, alertService, campService, missingPersonService,
  helpRequestService, resourceService,
} from "../../services/api";

// ─── Nav pages ────────────────────────────────────────────────────────────────

const PAGES = [
  { title: "Dashboard",        path: "/",                  icon: Home,          category: "Pages" },
  { title: "Live Map",         path: "/map",               icon: Map,           category: "Pages" },
  { title: "Incidents",        path: "/incidents",         icon: AlertTriangle, category: "Pages" },
  { title: "Suraksha Alerts",  path: "/suraksha-alerts",  icon: AlertCircle,   category: "Pages" },
  { title: "Reports",          path: "/reports",           icon: FileText,      category: "Pages" },
  { title: "Analytics",        path: "/analytics",         icon: BarChart2,     category: "Pages" },
  { title: "User Management",  path: "/users",             icon: Users,         category: "Pages" },
  { title: "Resources",        path: "/resources",         icon: Box,           category: "Pages" },
  { title: "Relief Camps",     path: "/camps",             icon: Tent,          category: "Pages" },
  { title: "Tokens",           path: "/tokens",            icon: Ticket,        category: "Pages" },
  { title: "Volunteers",       path: "/volunteers",        icon: HeartHandshake,category: "Pages" },
  { title: "Help Requests",    path: "/help-requests",     icon: HelpCircle,    category: "Pages" },
  { title: "Damage Assessment",path: "/damage-assessment", icon: Activity,      category: "Pages" },
  { title: "Missing Persons",  path: "/missing-persons",   icon: UserSearch,    category: "Pages" },
  { title: "Support",          path: "/support",           icon: Phone,         category: "Pages" },
  { title: "Donations",        path: "/donations",         icon: Gift,          category: "Pages" },
  { title: "Family Safety",    path: "/family-safety",     icon: Shield,        category: "Pages" },
  { title: "Water Monitor",    path: "/water-monitor",     icon: Droplet,       category: "Pages" },
  { title: "River Mappings",   path: "/river-mappings",    icon: Navigation,    category: "Pages" },
  { title: "AI Research",      path: "/ai-research",       icon: Brain,         category: "Pages" },
  { title: "Settings",         path: "/settings",          icon: Settings,      category: "Pages" },
];

// ─── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { title: "Go to Dashboard",       path: "/",                icon: Home,          shortcut: "G D" },
  { title: "Go to Live Map",        path: "/map",             icon: Map,           shortcut: "G M" },
  { title: "View Active Incidents", path: "/incidents",       icon: AlertTriangle, shortcut: "G I" },
  { title: "Send Alert",            path: "/suraksha-alerts", icon: Zap,           shortcut: "G A" },
  { title: "Water Monitor",         path: "/water-monitor",   icon: Droplet,       shortcut: "G W" },
  { title: "Missing Persons",       path: "/missing-persons", icon: UserSearch,    shortcut: "G P" },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Result {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  path: string;
  icon: React.ElementType;
  category: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

function severityColor(s?: string) {
  switch (s) {
    case "CRITICAL": return "bg-red-500";
    case "HIGH":     return "bg-orange-500";
    case "MEDIUM":   return "bg-yellow-500";
    default:         return "bg-emerald-500";
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery]           = useState("");
  const [selectedIndex, setSelected] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [liveResults, setLive]      = useState<Result[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ── Reset on open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelected(0);
      setLive([]);
    }
  }, [isOpen]);

  // ── Fetch live data when query ≥ 2 chars ─────────────────────────────────────
  const fetchLive = useCallback(async (q: string) => {
    setLoading(true);
    const results: Result[] = [];
    const lq = q.toLowerCase();

    try {
      const [incRes, alertRes, campRes, missingRes, helpRes, resRes] = await Promise.allSettled([
        incidentService.getIncidents(),
        alertService.getAlerts(),
        campService.getCamps(),
        missingPersonService.getMissing(),
        helpRequestService.getRequests(),
        resourceService.getResources(),
      ]);

      if (incRes.status === "fulfilled") {
        (incRes.value.data || [])
          .filter((i: any) => i.title?.toLowerCase().includes(lq) || i.location?.toLowerCase().includes(lq) || i.category?.toLowerCase().includes(lq))
          .slice(0, 4)
          .forEach((i: any) => results.push({
            id: `inc-${i.id}`,
            title: i.title || "Untitled Incident",
            subtitle: `${i.category} · ${i.location || "—"}`,
            badge: i.severity,
            badgeColor: severityColor(i.severity),
            path: "/incidents",
            icon: AlertTriangle,
            category: "Incidents",
          }));
      }

      if (alertRes.status === "fulfilled") {
        (alertRes.value.data || [])
          .filter((a: any) => a.title?.toLowerCase().includes(lq) || a.message?.toLowerCase().includes(lq))
          .slice(0, 3)
          .forEach((a: any) => results.push({
            id: `alert-${a.id}`,
            title: a.title || "Alert",
            subtitle: a.message?.slice(0, 80) || "",
            badge: a.type,
            badgeColor: a.type === "EMERGENCY" ? "bg-red-500" : "bg-orange-500",
            path: "/suraksha-alerts",
            icon: AlertCircle,
            category: "Alerts",
          }));
      }

      if (campRes.status === "fulfilled") {
        (campRes.value.data || [])
          .filter((c: any) => c.name?.toLowerCase().includes(lq) || c.location?.toLowerCase().includes(lq))
          .slice(0, 3)
          .forEach((c: any) => results.push({
            id: `camp-${c.id}`,
            title: c.name,
            subtitle: `${c.location} · ${c.currentOccupancy ?? 0}/${c.totalCapacity ?? 0} occupancy`,
            badge: c.status,
            badgeColor: "bg-emerald-500",
            path: "/camps",
            icon: Tent,
            category: "Relief Camps",
          }));
      }

      if (missingRes.status === "fulfilled") {
        (missingRes.value.data || [])
          .filter((m: any) => m.name?.toLowerCase().includes(lq) || m.lastSeenLocation?.toLowerCase().includes(lq))
          .slice(0, 3)
          .forEach((m: any) => results.push({
            id: `missing-${m.id}`,
            title: m.name || "Unknown",
            subtitle: `Last seen: ${m.lastSeenLocation || "—"} · Age: ${m.age ?? "?"}`,
            badge: m.status,
            badgeColor: m.status === "FOUND" ? "bg-emerald-500" : "bg-red-500",
            path: "/missing-persons",
            icon: UserSearch,
            category: "Missing Persons",
          }));
      }

      if (helpRes.status === "fulfilled") {
        (helpRes.value.data || [])
          .filter((h: any) => h.description?.toLowerCase().includes(lq) || h.location?.toLowerCase().includes(lq) || h.contactName?.toLowerCase().includes(lq))
          .slice(0, 3)
          .forEach((h: any) => results.push({
            id: `help-${h.id}`,
            title: h.contactName || h.description?.slice(0, 50) || "Help Request",
            subtitle: `${h.requestType || "General"} · ${h.location || "—"}`,
            badge: h.status,
            badgeColor: h.status === "RESOLVED" ? "bg-emerald-500" : h.status === "PENDING" ? "bg-yellow-500" : "bg-blue-500",
            path: "/help-requests",
            icon: HelpCircle,
            category: "Help Requests",
          }));
      }

      if (resRes.status === "fulfilled") {
        (resRes.value.data || [])
          .filter((r: any) => r.name?.toLowerCase().includes(lq) || r.type?.toLowerCase().includes(lq) || r.location?.toLowerCase().includes(lq))
          .slice(0, 3)
          .forEach((r: any) => results.push({
            id: `res-${r.id}`,
            title: r.name || r.type,
            subtitle: `${r.type} · ${r.location || "—"} · Qty: ${r.quantity ?? "?"}`,
            badge: r.status,
            badgeColor: r.status === "AVAILABLE" ? "bg-emerald-500" : "bg-gray-500",
            path: "/resources",
            icon: Box,
            category: "Resources",
          }));
      }
    } catch { /* non-critical */ }

    setLive(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      const t = setTimeout(() => fetchLive(query), 250);
      return () => clearTimeout(t);
    } else {
      setLive([]);
      setLoading(false);
    }
  }, [query, fetchLive]);

  // ── Build displayed list ──────────────────────────────────────────────────────
  const pageResults: Result[] = query
    ? PAGES
        .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
        .map(p => ({ id: `page-${p.path}`, ...p, subtitle: undefined, badge: undefined, badgeColor: undefined }))
    : [];

  const allResults: Result[] = query.length >= 2
    ? [...liveResults, ...pageResults]
    : [];

  // Group by category
  const categories = Array.from(new Set(allResults.map(r => r.category)));

  // Flat ordered list for keyboard navigation
  const flat: Result[] = categories.flatMap(cat => allResults.filter(r => r.category === cat));

  useEffect(() => { setSelected(0); }, [query]);

  // ── Scroll selected into view ─────────────────────────────────────────────────
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // ── Keyboard nav ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected(i => (i + 1) % Math.max(flat.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected(i => (i - 1 + Math.max(flat.length, 1)) % Math.max(flat.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = flat[selectedIndex] ?? (query ? null : QUICK_ACTIONS[selectedIndex]);
        if (target) { navigate(target.path); onClose(); }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, flat, selectedIndex, query, navigate, onClose]);

  if (!isOpen) return null;

  const goTo = (path: string) => { navigate(path); onClose(); };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[8vh] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f1929] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-slate-700/60"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Input ── */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-slate-700/60">
          {loading
            ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3 shrink-0" />
            : <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 mr-3 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-base font-medium"
            placeholder="Search pages, incidents, alerts, camps…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-md transition-colors mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[11px] text-gray-400 dark:text-slate-500 font-mono">
            Esc
          </kbd>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[62vh] overflow-y-auto" ref={listRef}>

          {/* Quick actions (shown when no query) */}
          {!query && (
            <div className="p-3">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_ACTIONS.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.path + i}
                      onClick={() => goTo(action.path)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 truncate">{action.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 ml-auto shrink-0 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search results */}
          {query.length >= 2 && (
            <>
              {flat.length === 0 && !loading && (
                <div className="py-16 text-center">
                  <Search className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No results for <span className="text-gray-700 dark:text-slate-300">"{query}"</span></p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Try a different keyword or browse pages above</p>
                </div>
              )}
              {flat.length === 0 && loading && (
                <div className="py-16 text-center">
                  <Loader2 className="w-7 h-7 text-blue-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400 dark:text-slate-500">Searching across all data…</p>
                </div>
              )}

              {categories.map(cat => {
                const items = allResults.filter(r => r.category === cat);
                return (
                  <div key={cat} className="px-3 py-2">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1.5 flex items-center gap-1.5">
                      {cat}
                      <span className="text-[9px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold">{items.length}</span>
                    </p>
                    <div className="space-y-0.5">
                      {items.map(item => {
                        const globalIdx = flat.indexOf(item);
                        const isSelected = globalIdx === selectedIndex;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            data-idx={globalIdx}
                            onClick={() => goTo(item.path)}
                            onMouseEnter={() => setSelected(globalIdx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-100 text-left ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-50 dark:hover:bg-slate-800/70 text-gray-700 dark:text-slate-300"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-white/20"
                                : "bg-gray-100 dark:bg-slate-800"
                            }`}>
                              <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-500 dark:text-slate-400"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-gray-800 dark:text-slate-200"}`}>
                                {highlight(item.title, query)}
                              </p>
                              {item.subtitle && (
                                <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-blue-100" : "text-gray-400 dark:text-slate-500"}`}>
                                  {highlight(item.subtitle, query)}
                                </p>
                              )}
                            </div>
                            {item.badge && (
                              <span className={`text-[9px] font-black text-white px-1.5 py-0.5 rounded-md shrink-0 ${item.badgeColor || "bg-gray-500"}`}>
                                {item.badge}
                              </span>
                            )}
                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white/70" : "text-gray-300 dark:text-slate-600"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Page search hint for short queries */}
          {query.length === 1 && (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-slate-500">Type at least <strong className="text-gray-600 dark:text-slate-300">2 characters</strong> to search all data</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#0b1120] border-t border-gray-100 dark:border-slate-700/60 flex items-center gap-4 text-[11px] text-gray-400 dark:text-slate-500">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-mono">↓</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-mono">↵</kbd>
            <span>open</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-mono">Esc</kbd>
            <span>close</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Live data from all modules</span>
          </div>
        </div>
      </div>
    </div>
  );
}
