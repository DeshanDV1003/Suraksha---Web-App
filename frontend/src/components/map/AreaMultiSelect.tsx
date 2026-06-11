import { useState, useRef, useEffect } from 'react'
import { MapPin, Search, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Predefined hierarchical geographic data
const REGIONS = [
  { id: 'all', name: 'All Island', type: 'Global' },
  {
    name: 'Western Province',
    type: 'Province',
    districts: [
      {
        name: 'Colombo',
        divisions: ['Colombo 01', 'Colombo 07', 'Homagama', 'Maharagama', 'Moratuwa', 'Padukka', 'Seethawaka', 'Dehiwala', 'Kesbewa', 'Kaduwela', 'Kolonnawa']
      },
      {
        name: 'Gampaha',
        divisions: ['Gampaha', 'Negombo', 'Kelaniya', 'Wattala', 'Biyagama', 'Mahara', 'Dompe', 'Attanagalla', 'Minuwangoda', 'Mirigama', 'Divulapitiya']
      },
      {
        name: 'Kalutara',
        divisions: ['Kalutara', 'Panadura', 'Beruwala', 'Bandaragama', 'Horana', 'Matugama', 'Agalawatta', 'Walallawita', 'Madurawela', 'Dodangoda']
      }
    ]
  },
  {
    name: 'Southern Province',
    type: 'Province',
    districts: [
      {
        name: 'Galle',
        divisions: ['Galle', 'Ambalangoda', 'Hikkaduwa', 'Benthota', 'Elpitiya', 'Niyagama', 'Karandeniya', 'Baddegama', 'Yakkalamulla', 'Imaduwa']
      },
      {
        name: 'Matara',
        divisions: ['Matara', 'Weligama', 'Hakmana', 'Akuressa', 'Kamburupitiya', 'Dickwella', 'Devinuwara', 'Pasgoda', 'Pitabeddara']
      },
      {
        name: 'Hambantota',
        divisions: ['Hambantota', 'Tangalle', 'Beliatta', 'Ambalantota', 'Tissamaharama', 'Lunugamvehera', 'Weeraketiya']
      }
    ]
  },
  {
    name: 'Central Province',
    type: 'Province',
    districts: [
      {
        name: 'Kandy',
        divisions: ['Kandy', 'Gampola', 'Nawalapitiya', 'Kundasale', 'Kadugannawa', 'Peradeniya', 'Katugastota']
      },
      {
        name: 'Matale',
        divisions: ['Matale', 'Dambulla', 'Galewela', 'Naula', 'Ukuwela', 'Yatawatta']
      },
      {
        name: 'Nuwara Eliya',
        divisions: ['Nuwara Eliya', 'Hatton', 'Talawakelle', 'Walapane', 'Hanguranketha']
      }
    ]
  }
  // Other provinces omitted for brevity but representable here
]

interface AreaMultiSelectProps {
  selectedLocations: string[];
  onChange: (locations: string[]) => void;
}

export function AreaMultiSelect({ selectedLocations, onChange }: AreaMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleLocation = (location: string) => {
    if (location === 'All Island') {
      // If toggling All Island ON, clear others. If OFF, just clear it.
      if (selectedLocations.includes('All Island')) {
        onChange([])
      } else {
        onChange(['All Island'])
      }
      return;
    }

    let newLocs = [...selectedLocations].filter(l => l !== 'All Island')
    if (newLocs.includes(location)) {
      newLocs = newLocs.filter(l => l !== location)
    } else {
      newLocs.push(location)
    }
    onChange(newLocs)
  }

  const removeLocation = (e: React.MouseEvent, location: string) => {
    e.stopPropagation()
    onChange(selectedLocations.filter(l => l !== location))
  }

  // Flatten options for search
  const allOptions: { name: string, type: string, parent?: string }[] = [{ name: 'All Island', type: 'Global' }]
  REGIONS.forEach(region => {
    if (region.name !== 'All Island') {
      allOptions.push({ name: region.name, type: 'Province' })
      region.districts?.forEach(dist => {
        allOptions.push({ name: dist.name, type: 'District', parent: region.name })
        dist.divisions.forEach(div => {
          allOptions.push({ name: div, type: 'GN Division', parent: dist.name })
        })
      })
    }
  })

  const filteredOptions = search.trim() === '' 
    ? allOptions 
    : allOptions.filter(opt => opt.name.toLowerCase().includes(search.toLowerCase()) || opt.parent?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Input Field / Trigger */}
      <div 
        onClick={() => setIsOpen(true)}
        className="min-h-[52px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center cursor-text transition-all focus-within:ring-2 focus-within:ring-[#0061ff]/30 focus-within:border-brand-500/50"
      >
        {selectedLocations.length === 0 && (
          <span className="text-gray-400 dark:text-gray-500 text-[11px] font-black uppercase tracking-widest pl-2">Select Regions, Districts or Divisions...</span>
        )}
        
        {selectedLocations.map(loc => (
          <div key={loc} className="bg-brand-500 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">{loc}</span>
            <button onClick={(e) => removeLocation(e, loc)} className="hover:bg-black/20 p-0.5 rounded-full transition-colors ml-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        <input 
          type="text" 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-[11px] font-black text-slate-800 uppercase tracking-widest px-2"
          placeholder={selectedLocations.length > 0 ? "Add more..." : ""}
        />
        
        <div className="pr-2 text-gray-400 dark:text-gray-500">
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-slate-900/10 max-h-[300px] overflow-y-auto z-50 p-2 animate-in fade-in slide-in-from-top-2">
          {filteredOptions.length === 0 ? (
             <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-xs font-bold">No areas found.</div>
          ) : (
            <div className="space-y-1">
              {filteredOptions.slice(0, 100).map((opt, i) => {
                const isSelected = selectedLocations.includes(opt.name)
                return (
                  <div 
                    key={i}
                    onClick={() => toggleLocation(opt.name)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all",
                      isSelected ? "bg-blue-50 text-brand-500" : "hover:bg-gray-50 dark:bg-gray-800/50 text-slate-700"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black uppercase tracking-widest">{opt.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                          opt.type === 'Province' ? "bg-purple-100 text-purple-700" :
                          opt.type === 'District' ? "bg-amber-100 text-amber-700" :
                          opt.type === 'Global' ? "bg-green-100 text-green-700" :
                          "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        )}>
                          {opt.type}
                        </span>
                        {opt.parent && <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 italic">in {opt.parent}</span>}
                      </div>
                    </div>
                    
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                      isSelected ? "bg-brand-500 border-brand-500 text-white" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    )}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                )
              })}
              {filteredOptions.length > 100 && (
                <div className="text-center p-2 text-xs font-bold text-gray-400 dark:text-gray-500">
                  Type to search more areas...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
