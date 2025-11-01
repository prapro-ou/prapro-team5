export const HEIGHT_DRAWING_CONSTANTS = {
  HEIGHT_OFFSETS: {
    0: 0,
    1: 2, 
    2: 18,
    3: 34,
    4: 50,
  },
  
  BORDER: {
    COLOR: 0x333333,
    WIDTH_FLAT: 1,
    WIDTH_SLOPE: 1,
  },
  
  SIDE_FACE: {
    COLOR: 0xADA288,
    ALPHA: 1.0,
  },
  
  SLOPE_SHADOW: {
    FACTOR: 0.6,
    LIGHT_FACTOR: 0.75,
    HIGHLIGHT_FACTOR: 1.15,
  },
} as const;
