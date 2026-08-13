export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

export interface DateRange {
  startDate: string; // ISO date format YYYY-MM-DD
  endDate: string;   // ISO date format YYYY-MM-DD
}

/**
 * Returns exact start and end ISO dates (YYYY-MM-DD) for a timeframe preset.
 */
export function getDateRangeFromPreset(preset: DatePreset, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const formatDate = (d: Date): string => {
    return d.toISOString().split('T')[0];
  };

  switch (preset) {
    case 'today': {
      const todayStr = formatDate(now);
      return { startDate: todayStr, endDate: todayStr };
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      return { startDate: yStr, endDate: yStr };
    }
    case 'this_week': {
      const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      return { startDate: formatDate(monday), endDate: formatDate(sunday) };
    }
    case 'last_week': {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek - 6;
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      return { startDate: formatDate(monday), endDate: formatDate(sunday) };
    }
    case 'this_month': {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    case 'last_month': {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    case 'this_quarter': {
      const qStartMonth = Math.floor(month / 3) * 3;
      const firstDay = new Date(year, qStartMonth, 1);
      const lastDay = new Date(year, qStartMonth + 3, 0);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    case 'this_year': {
      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    case 'last_year': {
      const firstDay = new Date(year - 1, 0, 1);
      const lastDay = new Date(year - 1, 11, 31);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    case 'custom': {
      const todayStr = formatDate(now);
      return {
        startDate: customStart || todayStr,
        endDate: customEnd || todayStr,
      };
    }
    default: {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
  }
}
