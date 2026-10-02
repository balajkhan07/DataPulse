export interface VisualizationTheme {
  id: string;
  name: string;
  description: string;
  background: {
    start: string;
    end: string;
    accent: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  bars: {
    palette: string[];
    track: string;
    value: string;
    topRank: string;
  };
  chrome: {
    grid: string;
    panel: string;
  };
  fontFamily: string;
}
