"use client";
import { useState } from "react";
import { Button, ChipButton, Toast, ToastRegion } from "./primitives";
import { GuestCard, type GuestCardTone } from "./GuestCard";
import { TabBar } from "./TabBar";

const SETS: Record<string, Array<{ name: string; tone: GuestCardTone; usual: string }>> = {
  personal: [
    { name: "Maya", tone: "orange", usual: "Skin fade, #2" },
    { name: "Sam", tone: "yellow", usual: "Oat flat white" },
    { name: "Ola", tone: "coral", usual: "Gel, short square" },
  ],
  business: [
    { name: "Corner Barber", tone: "green", usual: "4 guests today" },
    { name: "Bean There", tone: "sky", usual: "12 guests today" },
    { name: "Nails by Rae", tone: "lilac", usual: "2 guests today" },
  ],
};

export function InteractiveDemos() {
  const [tab, setTab] = useState("personal");
  const [on, setOn] = useState<string[]>(["Same as last time"]);
  const [toast, setToast] = useState(false);
  const opts = ["Same as last time", "No small talk", "Quick visit", "Text me when ready"];
  return (
    <div className="g-stack">
      <TabBar label="Demo tabs" tabs={[{ id: "personal", label: "Personal" }, { id: "business", label: "Business" }]} value={tab} onChange={setTab} />
      <div role="tabpanel" aria-labelledby={`tab-${tab}`} style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", justifyItems: "center" }}>
        {SETS[tab].map((c) => (
          <GuestCard key={c.name} variant="compact" tone={c.tone} data={{ name: c.name, usual: c.usual }} />
        ))}
      </div>
      <div className="g-row-flex">
        {opts.map((o) => (
          <ChipButton key={o} pressed={on.includes(o)} onClick={() => setOn((s) => (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]))}>{o}</ChipButton>
        ))}
      </div>
      <div className="g-row-flex">
        <Button onClick={() => { setToast(true); setTimeout(() => setToast(false), 3500); }}>Show a toast</Button>
      </div>
      {toast && (
        <ToastRegion>
          <Toast onClose={() => setToast(false)}>Access taken back. You are all square.</Toast>
        </ToastRegion>
      )}
    </div>
  );
}
