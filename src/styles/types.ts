export interface DiagramStyle {
  id: string;
  displayName: string;
  canvas: {
    background: string;
    gridColor: string;
    gridStyle: 'dots' | 'lines' | 'cross' | 'none';
  };
  nodeDefaults: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    borderRadius: number;
    shadow: string;
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    fontWeight: number;
  };
  edgeDefaults: {
    stroke: string;
    strokeWidth: number;
    type: string;
    animated: boolean;
    arrowType: string;
  };
  accentColors: string[];
  dark?: boolean;
}

export interface ColorPalette {
  id: string;
  displayName: string;
  colors: string[];
}
