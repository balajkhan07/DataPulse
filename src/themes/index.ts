import type { VisualizationTheme } from "@/themes/types";

export const themes: VisualizationTheme[] = [
  {
    id: "modern-dark",
    name: "Modern Dark",
    description: "Editorial contrast with electric accents",
    background: { start: "#090C14", end: "#12182A", accent: "#6C5CE7" },
    text: { primary: "#F7F8FC", secondary: "#C6CAD8", muted: "#747B92" },
    bars: {
      palette: ["#7C6CF2", "#30C5C7", "#FFB657", "#F97096", "#5B8DEF", "#A27DE8", "#4DD4AC", "#FF8364", "#6EA8FE", "#C39BF7"],
      track: "#FFFFFF12",
      value: "#FFFFFF",
      topRank: "#F6C85F",
    },
    chrome: { grid: "#FFFFFF0C", panel: "#FFFFFF0A" },
    fontFamily: "var(--font-sans)",
  },
  {
    id: "clean-light",
    name: "Clean Light",
    description: "Bright, restrained and presentation-ready",
    background: { start: "#F8F7F2", end: "#ECEFF5", accent: "#2E6BFF" },
    text: { primary: "#121620", secondary: "#41495B", muted: "#7D8492" },
    bars: {
      palette: ["#246BFD", "#12A594", "#F29D38", "#E45D75", "#6957D8", "#3F8CFF", "#47B881", "#F06449", "#8B5CF6", "#1CA7A8"],
      track: "#151A2510",
      value: "#121620",
      topRank: "#D98B13",
    },
    chrome: { grid: "#151A2510", panel: "#FFFFFF80" },
    fontFamily: "var(--font-sans)",
  },
  {
    id: "neon-signal",
    name: "Neon Signal",
    description: "High-energy color for technology stories",
    background: { start: "#080515", end: "#160B2E", accent: "#B7FF36" },
    text: { primary: "#F8FFF0", secondary: "#D8E9CD", muted: "#858E9D" },
    bars: {
      palette: ["#B7FF36", "#42E8E0", "#FF45C8", "#9C6CFF", "#FFDA3E", "#4C9BFF", "#FF6B6B", "#68FF9B", "#E575FF", "#53D8FB"],
      track: "#FFFFFF10",
      value: "#F8FFF0",
      topRank: "#B7FF36",
    },
    chrome: { grid: "#B7FF3612", panel: "#FFFFFF08" },
    fontFamily: "var(--font-sans)",
  },
  {
    id: "documentary",
    name: "Documentary",
    description: "Warm archival tones with quiet authority",
    background: { start: "#211E19", end: "#332C23", accent: "#D2B47A" },
    text: { primary: "#F4EBDD", secondary: "#D1C5B3", muted: "#928673" },
    bars: {
      palette: ["#CDAA6D", "#8AA29E", "#B97B67", "#A58BBD", "#8096B4", "#C29D88", "#7F9B73", "#B78891", "#9A9072", "#6E969A"],
      track: "#F4EBDD10",
      value: "#F4EBDD",
      topRank: "#E6C98F",
    },
    chrome: { grid: "#F4EBDD0D", panel: "#F4EBDD08" },
    fontFamily: "var(--font-serif)",
  },
  {
    id: "sports-broadcast",
    name: "Sports Broadcast",
    description: "Bold broadcast graphics with sharp contrast",
    background: { start: "#071A24", end: "#0B2A38", accent: "#FFCF33" },
    text: { primary: "#F7FBFD", secondary: "#BED0D8", muted: "#76909B" },
    bars: {
      palette: ["#FFCF33", "#27C2A5", "#3F8DFF", "#FF625E", "#AE75FF", "#29B6E9", "#FF9354", "#66C56C", "#E15DAD", "#8BA6FF"],
      track: "#FFFFFF12",
      value: "#FFFFFF",
      topRank: "#FFCF33",
    },
    chrome: { grid: "#FFFFFF0D", panel: "#FFFFFF09" },
    fontFamily: "var(--font-sans)",
  },
];

export const defaultTheme = themes[0];

export function getTheme(themeId: string): VisualizationTheme {
  return themes.find((theme) => theme.id === themeId) ?? defaultTheme;
}
