export type AppTheme = typeof lightTheme;
const shared = { accent: '#F36B21', accentSoft: '#FFF0E7', success: '#27A66B', danger: '#E74C3C', radius: 22 };
export const lightTheme = { ...shared, dark: false, background: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F2F2EF', text: '#171714', muted: '#777772', border: 'rgba(20,20,18,0.10)', glass: 'rgba(255,255,255,0.62)', tab: 'rgba(255,255,255,0.82)' };
export const darkTheme: AppTheme = { ...shared, dark: true, background: '#0B0B0A', surface: '#171716', surfaceAlt: '#232321', text: '#F8F8F4', muted: '#A5A59F', border: 'rgba(255,255,255,0.14)', glass: 'rgba(31,31,29,0.64)', tab: 'rgba(24,24,22,0.78)' };
