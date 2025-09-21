import React from "react";
import { Link, useLocation } from "react-router-dom";

// fallback icon if you don't have DashIcon
const DashIcon = () => <span className="inline-block w-4 h-4 bg-gray-300" />;

export default function SidebarLinks({ routes = [], currentLayout }) {
  const location = useLocation();

  // derive layout from prop or from URL (/admin, /member, /auth, ...)
  const detectedLayout =
    currentLayout ||
    (location.pathname.split("/")[1] ? `/${location.pathname.split("/")[1]}` : "/");

  const visibleRoutes = routes.filter((r) => !r.layout || r.layout === detectedLayout);

  const isActive = (route) =>
    location.pathname.startsWith(`${route.layout}/${route.path}`) ||
    location.pathname.includes(route.path);

  return (
    <ul>
      {visibleRoutes.map((route, idx) => {
        const active = isActive(route);
        return (
          <li key={`${route.layout}-${route.path}-${idx}`} className="relative mb-3">
            <Link to={`${route.layout}/${route.path}`} className="flex items-center px-8 py-2">
              <span className={active ? "font-bold text-brand-500 dark:text-white" : "font-medium text-gray-600"}>
                {route.icon ? route.icon : <DashIcon />}
              </span>

              <p className={`leading-1 ml-4 ${active ? "font-bold text-navy-700 dark:text-white" : "font-medium text-gray-600"}`}>
                {route.name}
              </p>

              {active && <div className="absolute right-0 top-1 h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
