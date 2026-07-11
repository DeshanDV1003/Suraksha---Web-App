import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Radio,
  BarChart3,
  Users,
  Package,
  Building2,
  QrCode,
  CreditCard,
  Shield,
  HandHelping,
  Home,
  UserSearch,
  ShieldCheck,
  HeartPulse,
  ExternalLink,
  ChevronDownIcon,
  MoreHorizontal,
  Settings,
  Map,
  Waves
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const mainItems: NavItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, name: "Dashboard", path: "/" },
  { icon: <MapPin className="w-5 h-5" />, name: "Live Map", path: "/map" },
  { icon: <Waves className="w-5 h-5" />, name: "Water Monitor", path: "/water-monitor" },
  { icon: <AlertTriangle className="w-5 h-5" />, name: "Incidents", path: "/incidents" },
  { icon: <Radio className="w-5 h-5" />, name: "Alerts", path: "/suraksha-alerts" },
  { icon: <BarChart3 className="w-5 h-5" />, name: "Analytics", path: "/reports" },
  { icon: <Users className="w-5 h-5" />, name: "User Management", path: "/users" },
];

const resourceItems: NavItem[] = [
  { icon: <Package className="w-5 h-5" />, name: "Resources", path: "/resources" },
  { icon: <Building2 className="w-5 h-5" />, name: "Relief Camps", path: "/camps" },
  { icon: <QrCode className="w-5 h-5" />, name: "Relief Tokens", path: "/tokens" },
  { icon: <CreditCard className="w-5 h-5" />, name: "Donations", path: "/donations" },
];

const safetyItems: NavItem[] = [
  { icon: <Shield className="w-5 h-5" />, name: "Volunteers", path: "/volunteers" },
  { icon: <HandHelping className="w-5 h-5" />, name: "Help Requests", path: "/help-requests" },
  { icon: <Home className="w-5 h-5" />, name: "Damage Assessment", path: "/damage-assessment" },
  { icon: <UserSearch className="w-5 h-5" />, name: "Missing Persons", path: "/missing-persons" },
  { icon: <ShieldCheck className="w-5 h-5" />, name: "Safety Roster", path: "/family-safety" },
  { icon: <HeartPulse className="w-5 h-5" />, name: "Medical Support", path: "/support" },
  { icon: <ExternalLink className="w-5 h-5" />, name: "Public Help Portal", path: "/request-help" },
  { icon: <ExternalLink className="w-5 h-5" />, name: "Public Missing Portal", path: "/missing-portal" },
];

const systemItems: NavItem[] = [
  { icon: <Settings className="w-5 h-5" />, name: "Settings", path: "/settings" },
  { icon: <Map className="w-5 h-5" />, name: "River Mappings", path: "/river-mappings" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { t } = useTranslation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: string;
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    const groups = [
      { type: "main", items: mainItems },
      { type: "resource", items: resourceItems },
      { type: "safety", items: safetyItems },
      { type: "system", items: systemItems },
    ];
    groups.forEach(({ type, items }) => {
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type, index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: string) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: string) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active text-brand-500"
                    : "menu-item-icon-inactive text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active text-brand-500"
                      : "menu-item-icon-inactive text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-lg">S</div>
               <span className="text-xl font-bold tracking-tight uppercase text-brand-500">Suraksha</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-lg">S</div>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar pb-10">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(mainItems, "main")}
            </div>
            
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Resources"
                ) : (
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(resourceItems, "resource")}
            </div>
            
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Safety & Support"
                ) : (
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(safetyItems, "safety")}
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "System"
                ) : (
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(systemItems, "system")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
