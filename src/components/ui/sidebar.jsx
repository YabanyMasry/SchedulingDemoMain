"use client";
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { Link } from "react-router-dom";

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "min-h-screen px-4 py-4 hidden md:flex md:flex-col bg-[var(--brand)] w-[300px] shrink-0 outline-none",
          className
        )}
        style={{ backgroundImage: "var(--brand-gradient)" }}
        animate={{
          width: animate ? (open ? "300px" : "64px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-[var(--brand)] w-full"
        )}
        style={{ backgroundImage: "var(--brand-gradient)" }}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-white"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-[var(--brand)] p-10 z-[100] flex flex-col justify-between",
                className
              )}
              style={{ backgroundImage: "var(--brand-gradient)" }}
            >
              <div
                className="absolute right-10 top-10 z-50 text-white"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      <span className="relative inline-flex shrink-0">
        {link.icon}
        {link.badge > 0 && !open && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {link.badge > 9 ? "9+" : link.badge}
          </span>
        )}
      </span>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-white/90 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>

      {link.badge > 0 && open && (
        <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {link.badge > 99 ? "99+" : link.badge}
        </span>
      )}
    </Link>
  );
};

export const SidebarProfile = ({
  profile,
  className,
  ...props
}) => {
  const { open, animate } = useSidebar();

  const expandedWidth = "190px";

  return (
    <div
      className={cn("flex items-center justify-start gap-2 py-2", className)}
      {...props}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
        {profile.initials}
      </div>

      <motion.div
        animate={{
          width: animate ? (open ? expandedWidth : 0) : expandedWidth,
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.15 }}
        className="overflow-hidden"
      >
        <div className="flex min-h-[56px] w-[190px] flex-col justify-center">
          <p className="truncate text-sm leading-4 text-white">{profile.name}</p>
          <p className="mt-1 truncate text-xs leading-4 text-white/70">{profile.email}</p>
          <Link
            to={profile.logoutHref ?? "/auth/logout"}
            className="mt-1 inline-block text-xs text-white/85 transition-colors duration-150 hover:text-white"
          >
            Logout
          </Link>
        </div>
      </motion.div>
    </div>
  );
};