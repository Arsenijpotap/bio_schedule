export type Subgroup = "all" | "1" | "2" | "3";

export type UserSettings = {
  course: number;
  groupName: string;
  subgroup: Subgroup;
};

export type Lesson = {
  id: string;
  date: string;
  weekday: string;
  time: string;
  subject: string;
  type?: string;
  teacher?: string;
  room?: string;
  address?: string;
  comment?: string;
  group?: string;
  subgroup?: string;
};

export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type MeResponse = {
  authenticated: boolean;
  user: (UserSettings & { telegramId: string }) | null;
};