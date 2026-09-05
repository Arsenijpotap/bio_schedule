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
        colorScheme: "light" | "dark";
      };
    };
  }
}

export default function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
    tg?.disableVerticalSwipes?.();
  }, []);

  return null;
}