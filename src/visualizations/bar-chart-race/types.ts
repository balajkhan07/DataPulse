export interface BarChartItemState {
  entityId: string;
  label: string;
  value: number;
  rank: number;
  position: number;
  opacity: number;
  color?: string;
  image?: string;
}

export interface BarChartRaceState {
  items: BarChartItemState[];
  timeLabel: string;
  periodIndex: number;
  periodProgress: number;
  maxValue: number;
}
