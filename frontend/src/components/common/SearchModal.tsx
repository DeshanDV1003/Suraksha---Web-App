import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, FileText, Map, AlertTriangle, Users, Box, Ticket,
  HeartHandshake, HelpCircle, Activity, Shield, Droplet, Settings,
  Navigation, Home, AlertCircle, Phone, UserSearch, ArrowRight,
  Loader2, BarChart2, Brain, Tent, Gift, Building2,
} from "lucide-react";
import { searchService } from "../../services/api";

// ─── Nav pages (static, always searchable) ───────────────────────────────────

const PAGES = [
  { title: "Dashboard",         path: "/",                  icon: Home },
  { title: "Live Map",          path: "/map",               icon: Map },
  { title: "Incidents",         path: "/incidents",         icon: AlertTriangle },
  { title: "Suraksha Alerts",   path: "/suraksha-alerts",   icon: AlertCircle },
  { title: "Reports",           path: "/reports",           icon: FileText },
  { title: "Analytics",         path: "/analytics",         icon: BarChart2 },
  { title: "User Management",   path: "/users",             icon: Users },
  { title: "Resources",         path: "/resources",         icon: Box },
  { title: "Relief Camps",      path: "/camps",             icon: Tent },
  { title: "Tokens",            path: "/tokens",            icon: Ticket },
  { title: "Volunteers",        path: "/volunteers",        icon: HeartHandshake },
  { title: "Tasks",             path: "/tasks",             icon: Activity },
  { title: "Help Requests",     path: "/help-requests",     icon: HelpCircle },
  { title: "Damage Assessment", path: "/damage-assessment", icon: Activity },
  { title: "Missing Persons",   path: "/missing-persons",   icon: UserSearch },
  { title: "Support",           path: "/support",           icon: Phone },
  { title: "Donations",         path: "/donations",         icon: Gift },
  { title: "Family Safety",     path: "/family-safety",     icon: Shield },
  { title: "Water Monitor",     path: "/water-monitor",     icon: Droplet },
  { title: "River Mappings",    path: "/river-mappings",    icon: Navigation },
  { title: "AI Research",       path: "/ai-research",       icon: Brain },
  { title: "Settings",          path: "/settings",          icon: Settings },
];

// ─── Category → icon ─────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, React.ElementType> = {
  "Incidents": AlertTriangle,
  "Alerts": AlertCircle,
  "Relief Camps": Tent,
  "Missing Persons": UserSearch,
  "Help Requests": HelpCircle,
  "Resources": Box,
  "Tasks": Activity,
  "Water Monitor": Droplet,
  "Safe Places": Shield,
  "Support Contacts": Phone,
  "People": Users,
  "Donations": Gift,
  "Hospitals": Building2,
  "Damage Assessments": Activity,
  "Pages": FileText,
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Result {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  path: string;
  icon: React.ElementType;
  category: string;
}

interface ServerHit {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  badge?: string;
  path: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function badgeColor(b?: string) {
  const v = (b || "").toUpperCase();
  if (["CRITICAL", "EMERGENCY", "DANGER", "MAJOR_FLOOD", "MISSING"].some(k => v.includes(k))) return "bg-red-500";
  if (["HIGH", "WARNING", "MINOR_FLOOD", "WATCH"].some(k => v.includes(k))) return "bg-orange-500";
  if (["MEDIUM", "PENDING", "PENDING_REVIEW"].some(k => v.includes(k))) return "bg-yellow-500";
  if (["OPEN", "AVAILABLE", "RESOLVED", "FOUND", "NORMAL", "ACTIVE"].some(k => v.includes(k))) return "bg-emerald-500";
  return "bg-slate-500";
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery]            = useState("");
  const [selectedIndex, setSelected] = useState(0);
  const [loading, setLoading]        = useState(false);
  const [hits, setHits]              = useState<Result[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const reqId    = useRef(0);
  const navigate = useNavigate();

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelected(0);
      setHits([]);
    }
  }, [isOpen]);

  // ── Query the system-wide search endpoint (debounced) ──────────────────────
  const runSearch = useCallback(async (q: string) => {
    const myId = ++reqId.current;
    setLoading(true);
    try {
      const res = await searchService.global(q);
      if (myId !== reqId.current) return; // a newer query superseded this one
      const serverHits: Result[] = (res.data?.results || []).map((h: ServerHit) => ({
        id: `${h.type}-${h.id}`,
        title: h.title,
        subtitle: h.subtitle,
        badge: h.badge,
        path: h.path,
        icon: CATEGORY_ICON[h.type] || FileText,
        category: h.type,
      }));
      const lq = q.toLowerCase();
      const pageHits: Result[] = PAGES
        .filter(p => p.title.toLowerCase().includes(lq))
        .map(p => ({ id: `page-${p.path}`, title: p.title, path: p.path, icon: p.icon, category: "Pages" }));
      setHits([...pageHits, ...serverHits]);
    } catch {
      if (myId === reqId.current) setHits([]);
    } finally {
      if (myId === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const t = setTimeout(() => runSearch(query.trim()), 220);
      return () => clearTimeout(t);
    }
    setHits([]);
    setLoading(false);
  }, [query, runSearch]);

  // ── Grouped + flat lists ──────────────────────────────────────────────────
  const browsing = query.trim().length < 2;
  const browseList: Result[] = browsing
    ? PAGES.map(p => ({ id: `page-${p.path}`, title: p.title, path: p.path, icon: p.icon, category: "Pages" }))
    : [];

  const active = browsing ? browseList : hits;
  const categories = Array.from(new Set(active.map(r => r.category)));
  const flat: Result[] = categories.flatMap(cat => active.filter(r => r.category === cat));

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // ── Keyboard nav ──────────────────────────────────────────────────────────
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
        const target = flat[selectedIndex];
        if (target) { navigate(target.path); onClose(); }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, flat, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  const goTo = (path: string) => { navigate(path); onClose(); };

  // ── Render ────────────────────────────────────────────────────────────────
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
            placeholder="Search the entire system…"
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

          {query.trim().length === 1 && (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Keep typing — <strong className="text-gray-600 dark:text-slate-300">2+ characters</strong> to search.
              </p>
            </div>
          )}

          {!browsing && flat.length === 0 && !loading && (
            <div className="py-16 text-center">
              <Search className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                No results for <span className="text-gray-700 dark:text-slate-300">"{query}"</span>
              </p>
            </div>
          )}

          {!browsing && flat.length === 0 && loading && (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-slate-500">Searching…</p>
            </div>
          )}

          {(browsing || flat.length > 0) && categories.map(cat => {
            const items = active.filter(r => r.category === cat);
            const Fallback = CATEGORY_ICON[cat] || FileText;
            return (
              <div key={cat} className="px-3 py-2">
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1.5 flex items-center gap-1.5">
                  {browsing ? "Jump to" : cat}
                  <span className="text-[9px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold">{items.length}</span>
                </p>
                <div className={browsing ? "grid grid-cols-2 gap-1" : "space-y-0.5"}>
                  {items.map(item => {
                    const globalIdx = flat.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = item.icon || Fallback;
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
                          isSelected ? "bg-white/20" : "bg-gray-100 dark:bg-slate-800"
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
                          <span className={`text-[9px] font-black text-white px-1.5 py-0.5 rounded-md shrink-0 ${badgeColor(item.badge)}`}>
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
          <div className="ml-auto">{flat.length > 0 && !browsing ? `${flat.length} result${flat.length === 1 ? "" : "s"}` : ""}</div>
        </div>
      </div>
    </div>
  );
}
