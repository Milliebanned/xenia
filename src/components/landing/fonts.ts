import { Instrument_Serif } from "next/font/google";

/** Refined serif used only for italic accent words. Falls back to system serif. */
export const accentSerif = Instrument_Serif({
  weight: "400",
  style: ["italic", "normal"],
  subsets: ["latin"],
  variable: "--xl-serif",
  display: "swap",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
});
