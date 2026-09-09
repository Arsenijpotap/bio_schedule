"use client";

import { useState } from "react";
import GroupWizard from "@/components/GroupWizard";
import type { UserSettings } from "@/types";

export default function SetupForm({ onSaved }: { onSaved: (settings: UserSettings) => void }) {
  const [step, setStep] = useState<"course" | "group" | "subgroup">("course");

  return (
    <main className="app" id="main">
      <div className="container" style={{ paddingTop: 48 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="hint" style={{ fontSize: 14, marginBottom: 8 }}>
            <span translate="no">БГУ</span> · расписание
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: 0 }}>
            {step === "course" && "Выбери курс"}
            {step === "group" && "Выбери группу"}
            {step === "subgroup" && "Выбери подгруппу"}
          </h1>
          <p className="hint" style={{ lineHeight: 1.5 }}>
            {step === "course" && "Укажи курс, чтобы подобрать расписание."}
            {step === "group" && "Найдены группы твоего курса."}
            {step === "subgroup" && "Уточни подгруппу — расписание подстроится под неё."}
          </p>
        </div>

        <GroupWizard onSaved={onSaved} onStepChange={setStep} />
      </div>
    </main>
  );
}
