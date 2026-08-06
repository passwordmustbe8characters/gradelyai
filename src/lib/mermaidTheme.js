// Shared Mermaid init config — used by both the live diagram viewer
// (DiagramCarousel.jsx) and the Word/PDF export rasterizer (export.js) so a
// diagram looks the same wherever it's rendered. 'base' + explicit
// themeVariables gives a branded, intentional look instead of the flat
// default 'neutral' theme, which is the main reason AI-generated diagrams
// tend to look generic.
export const MERMAID_CONFIG = {
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    primaryColor: '#e6f4f8',
    primaryTextColor: '#1a1a1a',
    primaryBorderColor: '#007ea7',
    lineColor: '#007ea7',
    secondaryColor: '#fff4e0',
    secondaryBorderColor: '#e8a020',
    tertiaryColor: '#f7f6f3',
    tertiaryBorderColor: '#ccc',
    fontFamily: 'Geist, -apple-system, sans-serif',
    fontSize: '14px',
  },
}
