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
  Waves,
  Brain,
  ClipboardList,
  Hospital,
  BedDouble,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  nameKey: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  subItems?: { nameKey: string; path: string; pro?: boolean; new?: boolean }[];
};

const ALL_STAFF = ['ADMIN', 'DMC_OFFICER', 'FIELD_RESPONDER'];
const ALL_ROLES = ['ADMIN', 'DMC_OFFICER', 'FIELD_RESPONDER', 'VOLUNTEER', 'CITIZEN'];

const hospitalItems: NavItem[] = [
  { icon: <Hospital className="w-5 h-5" />, nameKey: "nav.hospital_dashboard", path: "/hospital", roles: ['HOSPITAL_STAFF'] },
  { icon: <BedDouble className="w-5 h-5" />, nameKey: "nav.hospital_referrals", path: "/hospital/referrals", roles: ['HOSPITAL_STAFF'] },
  { icon: <Package className="w-5 h-5" />, nameKey: "nav.hospital_capacity", path: "/hospital/capacity", roles: ['HOSPITAL_STAFF'] },
];

const mainItems: NavItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, nameKey: "nav.dashboard", path: "/", roles: ALL_STAFF },
  { icon: <LayoutDashboard className="w-5 h-5" />, nameKey: "nav.dashboard", path: "/citizen-home", roles: ['CITIZEN', 'VOLUNTEER'] },
  { icon: <MapPin className="w-5 h-5" />, nameKey: "nav.map", path: "/map", roles: ALL_ROLES },
  { icon: <Waves className="w-5 h-5" />, nameKey: "nav.water_monitor", path: "/water-monitor", roles: ALL_STAFF },
  { icon: <AlertTriangle className="w-5 h-5" />, nameKey: "nav.incidents", path: "/incidents", roles: ALL_ROLES },
  { icon: <Radio className="w-5 h-5" />, nameKey: "nav.alerts", path: "/suraksha-alerts", roles: ALL_ROLES },
  { icon: <BarChart3 className="w-5 h-5" />, nameKey: "nav.analytics", path: "/reports", roles: ['ADMIN', 'DMC_OFFICER'] },
  { icon: <Users className="w-5 h-5" />, nameKey: "nav.user_management", path: "/users", roles: ['ADMIN'] },
];

const resourceItems: NavItem[] = [
  { icon: <Package className="w-5 h-5" />, nameKey: "nav.resources", path: "/resources", roles: ALL_STAFF },
  { icon: <Building2 className="w-5 h-5" />, nameKey: "nav.camps", path: "/camps", roles: ALL_ROLES },
  { icon: <QrCode className="w-5 h-5" />, nameKey: "nav.relief_tokens", path: "/tokens", roles: ['ADMIN', 'DMC_OFFICER', 'FIELD_RESPONDER', 'VOLUNTEER'] },
  { icon: <CreditCard className="w-5 h-5" />, nameKey: "nav.donations", path: "/donations", roles: ['ADMIN', 'DMC_OFFICER'] },
];

const safetyItems: NavItem[] = [
  { icon: <Shield className="w-5 h-5" />, nameKey: "nav.volunteers", path: "/volunteers", roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER'] },
  { icon: <ClipboardList className="w-5 h-5" />, nameKey: "nav.tasks", path: "/tasks", roles: ['ADMIN', 'DMC_OFFICER'] },
  { icon: <HandHelping className="w-5 h-5" />, nameKey: "nav.help_requests", path: "/help-requests", roles: ALL_ROLES },
  { icon: <Home className="w-5 h-5" />, nameKey: "nav.damage_assessment", path: "/damage-assessment", roles: ALL_ROLES },
  { icon: <UserSearch className="w-5 h-5" />, nameKey: "nav.missing_persons", path: "/missing-persons", roles: ALL_ROLES },
  { icon: <ShieldCheck className="w-5 h-5" />, nameKey: "nav.family_safety", path: "/family-safety", roles: ALL_ROLES },
  { icon: <HeartPulse className="w-5 h-5" />, nameKey: "nav.support", path: "/support", roles: ALL_ROLES },
  { icon: <ExternalLink className="w-5 h-5" />, nameKey: "nav.public_help_portal", path: "/request-help", roles: ALL_ROLES },
  { icon: <ExternalLink className="w-5 h-5" />, nameKey: "nav.public_missing_portal", path: "/missing-portal", roles: ALL_ROLES },
];

const systemItems: NavItem[] = [
  { icon: <Brain className="w-5 h-5" />, nameKey: "nav.ai_research", path: "/ai-research", roles: ['ADMIN', 'DMC_OFFICER'] },
  { icon: <Settings className="w-5 h-5" />, nameKey: "nav.settings", path: "/settings", roles: ALL_ROLES },
  { icon: <Map className="w-5 h-5" />, nameKey: "nav.river_mappings", path: "/river-mappings", roles: ['ADMIN', 'DMC_OFFICER'] },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const role = user?.role || 'CITIZEN';

  const filterByRole = (items: NavItem[]) =>
    items.filter(item => !item.roles || item.roles.includes(role));

  const filteredMain     = filterByRole(mainItems);
  const filteredResource = filterByRole(resourceItems);
  const filteredSafety   = filterByRole(safetyItems);
  const filteredSystem   = filterByRole(systemItems);
  const filteredHospital = filterByRole(hospitalItems);

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
        <li key={nav.nameKey}>
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
                <span className="menu-item-text">{t(nav.nameKey)}</span>
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
                  <span className="menu-item-text">{t(nav.nameKey)}</span>
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
                  <li key={subItem.nameKey}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {t(subItem.nameKey)}
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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-[#050c1a] border-r border-gray-200 dark:border-cyan-400/20 text-slate-700 dark:text-slate-200 h-screen transition-all duration-300 ease-in-out z-50
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
               <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-bold text-lg">S</div>
               <span className="text-xl font-bold tracking-tight uppercase text-cyan-400">Suraksha</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-bold text-lg">S</div>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar pb-10">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 dark:text-cyan-400/50 font-semibold tracking-widest ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t('nav.command_center')
                ) : (
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(filteredMain, "main")}
            </div>

            {filteredResource.length > 0 && (
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 dark:text-cyan-400/50 font-semibold tracking-widest ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? t('nav.resources') : <MoreHorizontal className="w-5 h-5" />}
              </h2>
              {renderMenuItems(filteredResource, "resource")}
            </div>
            )}

            {filteredSafety.length > 0 && (
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 dark:text-cyan-400/50 font-semibold tracking-widest ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? t('nav.safety_support') : <MoreHorizontal className="w-5 h-5" />}
              </h2>
              {renderMenuItems(filteredSafety, "safety")}
            </div>
            )}

            {filteredHospital.length > 0 && (
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 dark:text-cyan-400/50 font-semibold tracking-widest ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? 'Hospital' : <MoreHorizontal className="w-5 h-5" />}
              </h2>
              {renderMenuItems(filteredHospital, "hospital")}
            </div>
            )}

            {filteredSystem.length > 0 && (
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 dark:text-cyan-400/50 font-semibold tracking-widest ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? t('settings_page.system') : <MoreHorizontal className="w-5 h-5" />}
              </h2>
              {renderMenuItems(filteredSystem, "system")}
            </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
