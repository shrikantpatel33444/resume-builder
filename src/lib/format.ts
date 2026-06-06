import type { Country } from '../types';

export function formatDate(date: string, country: Country): string {
  if (!date || date === 'Present') return date || '';
  const [y, m] = date.split('-').map((p) => parseInt(p, 10));
  if (!y || !m) return date;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  switch (country) {
    case 'Germany':
    case 'France':
      return `${String(m).padStart(2, '0')}/${y}`;
    case 'Japan':
      return `${y}年${m}月`;
    case 'USA':
    case 'Canada':
      return `${monthShort[m - 1]} ${y}`;
    case 'Malaysia':
    case 'Singapore':
    case 'UK':
    case 'Australia':
    case 'India':
    case 'UAE':
    case 'International':
    default:
      return `${monthNames[m - 1]} ${y}`;
  }
}

export function formatRange(start: string, end: string, country: Country): string {
  const s = formatDate(start, country);
  const e = end === 'Present' ? 'Present' : formatDate(end, country);
  if (!s && !e) return '';
  return `${s} – ${e}`;
}

export const COUNTRY_FLAGS: Record<Country, string> = {
  USA: '🇺🇸',
  UK: '🇬🇧',
  Germany: '🇩🇪',
  France: '🇫🇷',
  Australia: '🇦🇺',
  Canada: '🇨🇦',
  India: '🇮🇳',
  UAE: '🇦🇪',
  Singapore: '🇸🇬',
  Japan: '🇯🇵',
  Malaysia: '🇲🇾',
  International: '🌍',
};
