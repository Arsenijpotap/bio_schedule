"use client";

import { useEffect } from "react";

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
