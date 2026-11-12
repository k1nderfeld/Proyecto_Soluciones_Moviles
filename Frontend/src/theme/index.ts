import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primarySoft: '#CCFBF1',
  primaryText: '#134E4A',
  accent: '#D97706',
  accentSoft: '#FEF3C7',
  accentText: '#92400E',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',
  success: '#15803D',
  successSoft: '#DCFCE7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  info: '#1D4ED8',
  infoSoft: '#DBEAFE',
  overlay: 'rgba(15, 23, 42, 0.55)',
  shadow: '#0F172A',
  white: '#FFFFFF',
  black: '#000000',
  tabInactive: '#94A3B8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as TextStyle['fontWeight'] },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as TextStyle['fontWeight'] },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as TextStyle['fontWeight'] },
  subheading: { fontSize: 17, lineHeight: 23, fontWeight: '600' as TextStyle['fontWeight'] },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as TextStyle['fontWeight'] },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as TextStyle['fontWeight'] },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as TextStyle['fontWeight'] },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as TextStyle['fontWeight'] },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as TextStyle['fontWeight'] },
};

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 2 },
    default: {},
  }),
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }),
};

export const layout = {
  screenPadding: spacing.lg,
  maxContentWidth: 720,
  tabBarHeight: 64,
  minTouchTarget: 48,
};
