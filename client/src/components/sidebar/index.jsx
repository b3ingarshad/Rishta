import React from "react";
import { HiX } from "react-icons/hi";
import SidebarLinks from "./components/Links";


const Sidebar = ({ open, onClose, routes = [], currentLayout }) => {
  return (
    <div
      className={`sm:none duration-175 linear fixed !z-50 flex min-h-full flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      {/* Close btn */}
      <span
        className="absolute top-4 right-4 block cursor-pointer xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      {/* Logo */}
      <div className="mx-[56px] mt-[50px] flex items-center">
        <img
          src="https://www.rishtaforyou.com/ProClassifiedListing/images/logo.png"
          alt="Logo"
        />
      </div>

      <div className="mt-[58px] mb-7 h-px bg-gray-300 dark:bg-white/30" />

      {/* Nav items */}
      <nav className="mb-auto pt-1">
        <SidebarLinks routes={routes} currentLayout={currentLayout} />
      </nav>
    </div>
  );
};

export default Sidebar;
