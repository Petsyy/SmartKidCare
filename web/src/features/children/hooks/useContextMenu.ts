import { useState, useEffect } from "react";

export type { MenuState } from "../types";

export function useContextMenu() {
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const [menuUser, setMenuUser] = useState<any>(null);

  const openMenu = (user: any, buttonEl: HTMLButtonElement) => {
    setMenuUser(user);
    setOpenMenuUserId(user._id);
    setMenuAnchorRect(buttonEl.getBoundingClientRect());
  };

  const closeMenu = () => {
    setOpenMenuUserId(null);
    setMenuAnchorRect(null);
    setMenuUser(null);
  };

  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    if (openMenuUserId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuUserId]);

  return { openMenuUserId, menuAnchorRect, menuUser, openMenu, closeMenu };
}
