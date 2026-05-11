import type { Theme } from '@/types'

export interface ThemeConfig {
  id: Theme
  label: string
  bg: string
  surface: string
  accent: string
  text: string
  muted: string
  fontFamily: string
}

export const THEMES: Record<Theme, ThemeConfig> = {
  daily: {
    id: 'daily',
    label: '日常',
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    accent: '#111111',
    text: '#111111',
    muted: '#888888',
    fontFamily: 'sans-serif',
  },
  cafe: {
    id: 'cafe',
    label: 'カフェ',
    bg: '#F5E6D3',
    surface: '#FFFBF5',
    accent: '#8B5E3C',
    text: '#3D2B1F',
    muted: '#A0856C',
    fontFamily: 'Georgia, serif',
  },
  travel: {
    id: 'travel',
    label: '旅',
    bg: '#E8F4F8',
    surface: '#FFFFFF',
    accent: '#2C7DA0',
    text: '#1A3A4A',
    muted: '#6B9EB0',
    fontFamily: 'sans-serif',
  },
  night: {
    id: 'night',
    label: '夜',
    bg: '#0D0D14',
    surface: '#1A1A2E',
    accent: '#E94560',
    text: '#E8E8F0',
    muted: '#6B6B80',
    fontFamily: 'sans-serif',
  },
  minimal: {
    id: 'minimal',
    label: 'ミニマル',
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    accent: '#000000',
    text: '#000000',
    muted: '#AAAAAA',
    fontFamily: '"Helvetica Neue", sans-serif',
  },
  wedding: {
    id: 'wedding',
    label: 'ウェディング',
    bg: '#FDF8F5',
    surface: '#FFFFFF',
    accent: '#C9A882',
    text: '#3D2B1F',
    muted: '#C9A882',
    fontFamily: 'Georgia, serif',
  },
  birthday: {
    id: 'birthday',
    label: '誕生日',
    bg: '#FFF0F6',
    surface: '#FFFFFF',
    accent: '#FF4DA6',
    text: '#2D1B25',
    muted: '#D490B0',
    fontFamily: 'sans-serif',
  },
}

export function getTheme(id: Theme): ThemeConfig {
  return THEMES[id] ?? THEMES.daily
}
