export const themeColors = {
  light: {
    background: 'rgb(241, 245, 249)', // Main app background (Slate-100)
    surface: 'rgb(255, 255, 255)',    // Cards, Sidebar
    surfaceHighlight: 'rgb(248, 250, 252)', // Hover states
    border: 'rgb(226, 232, 240)',     // Slate-200
    text: {
      primary: 'rgb(15, 23, 42)',     // Slate-900
      secondary: 'rgb(100, 116, 139)', // Slate-500
      muted: 'rgb(148, 163, 184)',    // Slate-400
    },
    primary: 'rgb(37, 99, 235)',      // Blue-600
  },
  dark: {
    background: 'rgb(2, 6, 23)',      // Slate-950
    surface: 'rgb(15, 23, 42)',       // Slate-900
    surfaceHighlight: 'rgb(30, 41, 59)', // Slate-800
    border: 'rgb(30, 41, 59)',        // Slate-800
    text: {
      primary: 'rgb(255, 255, 255)',  // White
      secondary: 'rgb(148, 163, 184)', // Slate-400
      muted: 'rgb(100, 116, 139)',    // Slate-500
    },
    primary: 'rgb(96, 165, 250)',     // Blue-400
  }
} as const;

export type ThemeColors = typeof themeColors;