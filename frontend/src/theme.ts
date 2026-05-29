import type {} from "@mui/material/themeCssVarsAugmentation";
import { createTheme, type Shadows } from "@mui/material/styles";

// Linen design tokens — one set per color scheme.
const light = {
  bright: "#ffffff", // raised surfaces (cards, popovers)
  paper: "#fafaf9", // page background
  cream: "#f3f3f1", // alt / hover surface
  linen: "#e9e9e6", // sunken
  bone: "#dcdcd8",
  stone: "#bfbfba",

  ink1: "#1c1c1a", // primary text
  ink2: "#36352f",
  ink3: "#6a6964", // secondary text
  ink4: "#92918b", // disabled / placeholder
  ink5: "#c0bfb9", // divider
  ink6: "#dbdad4", // soft border

  sage: "#9fae94",
  sageTint: "#e6ecdf",
  clay: "#c49a7c",
  clayTint: "#f1e3d5",
  sky: "#a6b6c2",
  skyTint: "#e3eaef",
  blush: "#c9a4a0",
  blushTint: "#f1dfdc",
  rose: "#b58280",
  roseTint: "#eed8d6",
};

const dark: typeof light = {
  bright: "#242220", // raised surfaces
  paper: "#1b1a18", // page background
  cream: "#2c2a27", // alt / hover surface
  linen: "#141312", // sunken
  bone: "#3a3833",
  stone: "#524f49",

  ink1: "#f3f2ec", // primary text
  ink2: "#dcdad3",
  ink3: "#a9a79f", // secondary text
  ink4: "#7a786f", // disabled / placeholder
  ink5: "#423f3a", // divider
  ink6: "#322f2b", // soft border

  sage: "#9fae94",
  sageTint: "#2a3326",
  clay: "#c49a7c",
  clayTint: "#38291d",
  sky: "#a6b6c2",
  skyTint: "#232f37",
  blush: "#c9a4a0",
  blushTint: "#3a2826",
  rose: "#b58280",
  roseTint: "#382422",
};

// Fixed dark ink used as contrast on the (constant) accent fills, regardless of scheme.
const onAccent = light.ink1;

// Custom palette tokens so component overrides switch automatically via theme.vars.
declare module "@mui/material/styles" {
  interface Palette {
    surface: { alt: string; sunken: string };
    border: { soft: string };
  }
  interface PaletteOptions {
    surface?: { alt: string; sunken: string };
    border?: { soft: string };
  }
}

function makePalette(c: typeof light) {
  return {
    primary: { main: c.clay, contrastText: onAccent },
    secondary: { main: c.sky, contrastText: onAccent },
    success: { main: c.sage, contrastText: onAccent },
    info: { main: c.sky, contrastText: onAccent },
    warning: { main: c.blush, contrastText: onAccent },
    error: { main: c.rose, contrastText: onAccent },
    background: { default: c.paper, paper: c.bright },
    text: { primary: c.ink1, secondary: c.ink3, disabled: c.ink4 },
    divider: c.ink5,
    common: { black: light.ink1, white: light.bright },
    surface: { alt: c.cream, sunken: c.linen },
    border: { soft: c.ink6 },
  };
}

const fontDisplay = '"Geist", ui-sans-serif, system-ui, sans-serif';
const fontSans = '"Geist", ui-sans-serif, system-ui, sans-serif';
const fontMono = '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace';

const ease = "cubic-bezier(0.2, 0, 0, 1)";

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data" },
  colorSchemes: {
    light: { palette: makePalette(light) },
    dark: { palette: makePalette(dark) },
  },
  shape: { borderRadius: 8 },
  spacing: 4,
  typography: {
    fontFamily: fontSans,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    fontSize: 16,
    htmlFontSize: 16,
    h1: {
      fontFamily: fontDisplay,
      fontWeight: 500,
      fontSize: 60,
      lineHeight: 1.08,
      letterSpacing: "-0.028em",
    },
    h2: {
      fontFamily: fontDisplay,
      fontWeight: 500,
      fontSize: 44,
      lineHeight: 1.08,
      letterSpacing: "-0.024em",
    },
    h3: {
      fontFamily: fontDisplay,
      fontWeight: 500,
      fontSize: 32,
      lineHeight: 1.25,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontFamily: fontDisplay,
      fontWeight: 500,
      fontSize: 24,
      lineHeight: 1.25,
      letterSpacing: "-0.015em",
    },
    h5: {
      fontFamily: fontSans,
      fontWeight: 500,
      fontSize: 18,
      lineHeight: 1.25,
    },
    h6: {
      fontFamily: fontSans,
      fontWeight: 500,
      fontSize: 14,
      lineHeight: 1.25,
    },
    body1: { fontSize: 16, lineHeight: 1.55 },
    body2: { fontSize: 14, lineHeight: 1.55 },
    button: {
      fontWeight: 500,
      letterSpacing: 0,
      textTransform: "none",
    },
    caption: { fontSize: 12 },
    overline: {
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(40,40,38,0.05), 0 1px 1px rgba(40,40,38,0.03)",
    "0 8px 24px rgba(40,40,38,0.07), 0 2px 6px rgba(40,40,38,0.04)",
    ...Array<string>(22).fill(
      "0 8px 24px rgba(40,40,38,0.07), 0 2px 6px rgba(40,40,38,0.04)",
    ),
  ] as Shadows,
  transitions: {
    easing: { easeInOut: ease, easeIn: ease, easeOut: ease, sharp: ease },
    duration: {
      shortest: 160,
      shorter: 160,
      short: 220,
      standard: 220,
      complex: 220,
      enteringScreen: 220,
      leavingScreen: 160,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        "html, body": {
          backgroundColor: theme.vars.palette.background.default,
          color: theme.vars.palette.text.primary,
          fontFamily: fontSans,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },
        "::selection": {
          background: theme.vars.palette.action.selected,
          color: theme.vars.palette.text.primary,
        },
        a: {
          color: theme.vars.palette.text.primary,
          textDecoration: "underline",
          textDecorationThickness: "1px",
          textUnderlineOffset: "3px",
          textDecorationColor: theme.vars.palette.text.disabled,
          transition: `text-decoration-color 160ms ${ease}`,
        },
        "a:hover": { textDecorationColor: theme.vars.palette.text.primary },
        "code, kbd, samp": {
          fontFamily: fontMono,
          fontSize: "0.92em",
          background: theme.vars.palette.surface.alt,
          padding: "0.1em 0.35em",
          borderRadius: 4,
        },
        pre: {
          fontFamily: fontMono,
          background: theme.vars.palette.surface.alt,
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
          fontSize: 14,
          lineHeight: 1.25,
        },
        "pre code": { background: "transparent", padding: 0 },
        hr: {
          border: "none",
          borderTop: `1px solid ${theme.vars.palette.divider}`,
          margin: "32px 0",
        },
        "*:focus-visible": {
          outline: `2px solid ${theme.vars.palette.primary.main}`,
          outlineOffset: 2,
          borderRadius: 4,
        },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 16,
          paddingBlock: 8,
          fontWeight: 500,
        },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            "&:hover": { filter: "brightness(0.96)" },
          },
        },
        {
          props: { variant: "outlined" },
          style: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
        },
        {
          props: { variant: "text" },
          style: ({ theme }) => ({ color: theme.vars.palette.text.primary }),
        },
      ],
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: "none",
          backgroundColor: theme.vars.palette.background.paper,
          border: `1px solid ${theme.vars.palette.border.soft}`,
        }),
        elevation1: {
          boxShadow:
            "0 1px 2px rgba(40,40,38,0.05), 0 1px 1px rgba(40,40,38,0.03)",
        },
        elevation2: {
          boxShadow:
            "0 8px 24px rgba(40,40,38,0.07), 0 2px 6px rgba(40,40,38,0.04)",
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "default" },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.default,
          color: theme.vars.palette.text.primary,
          borderBottom: `1px solid ${theme.vars.palette.border.soft}`,
        }),
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined", size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          "& fieldset": { borderColor: theme.vars.palette.divider },
          "&:hover fieldset": { borderColor: theme.vars.palette.text.secondary },
          "&.Mui-focused fieldset": {
            borderColor: theme.vars.palette.primary.main,
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 999,
          backgroundColor: theme.vars.palette.surface.alt,
          color: theme.vars.palette.text.primary,
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.vars.palette.text.primary,
          color: theme.vars.palette.background.paper,
          fontSize: 12,
          borderRadius: 6,
        }),
      },
    },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: {
        root: ({ theme }) => ({ color: theme.vars.palette.text.primary }),
      },
    },
  },
});

export default theme;
export { light as linen };
