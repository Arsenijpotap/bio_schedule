"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes?: () => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        colorScheme: "light" | "dark";
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          secondary_bg_color?: string;
          button_color?: string;
          button_text_color?: string;
          link_color?: string;
        };
      };
    };
  }
}

export default function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    applyTheme(getStoredTheme());
  }, []);

  return null;
}

export async function getTelegramInitData() {
  if (typeof window === "undefined") return "";

  for (let i = 0; i < 40; i++) {
    const value = window.Telegram?.WebApp?.initData ?? "";
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return window.Telegram?.WebApp?.initData ?? "";
}
