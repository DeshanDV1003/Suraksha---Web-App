import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, FileText, Map, AlertTriangle, Users, Box, MapPin, Ticket, HeartHandshake, HelpCircle, Activity, Search as SearchIcon, Shield, Droplet, Settings, Navigation, Home, AlertCircle, Phone } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_ITEMS = [
  { title: "Dashboard", path: "/", icon: Home, category: "Main" },
  { title: "Map View", path: "/map", icon: Map, category: "Main" },
  { title: "Incidents", path: "/incidents", icon: AlertTriangle, category: "Operations" },
  { title: "Suraksha Alerts", path: "/suraksha-alerts", icon: AlertCircle, category: "Operations" },
  { title: "Reports", path: "/reports", icon: FileText, category: "Analytics" },
  { title: "User Management", path: "/users", icon: Users, category: "Administration" },
  { title: "Resources", path: "/resources", icon: Box, category: "Operations" },
  { title: "Relief Camps", path: "/camps", icon: MapPin, category: "Operations" },
  { title: "Tokens", path: "/tokens", icon: Ticket, category: "Administration" },
  { title: "Volunteers", path: "/volunteers", icon: HeartHandshake, category: "Operations" },
  { title: "Help Requests", path: "/help-requests", icon: HelpCircle, category: "Operations" },
  { title: "Damage Assessment", path: "/damage-assessment", icon: Activity, category: "Analytics" },
  { title: "Missing Persons", path: "/missing-persons", icon: SearchIcon, category: "Operations" },
  { title: "Support", path: "/support", icon: Phone, category: "Main" },
  { title: "Donations", path: "/donations", icon: HeartHandshake, category: "Operations" },
  { title: "Family Safety", path: "/family-safety", icon: Shield, category: "Main" },
  { title: "Water Monitor", path: "/water-monitor", icon: Droplet, category: "Operations" },
  { title: "River Mappings", path: "/river-mappings", icon: Navigation, category: "Operations" },
  { title: "Settings", path: "/settings", icon: Settings, category: "Administration" },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredItems = SEARCH_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems.length > 0) {
          navigate(filteredItems[selectedIndex].path);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-lg"
            placeholder="Search for pages, features..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.path}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-150 group ${
                      isSelected 
                        ? 'bg-brand-500 text-white dark:bg-brand-600' 
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={`p-2 rounded-lg mr-4 ${
                      isSelected
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">{item.title}</span>
                      <span className={`text-xs ${isSelected ? 'text-brand-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {item.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-sans">↑</kbd>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-sans">↓</kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-sans">Enter</kbd>
            <span>to select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-sans">Esc</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
