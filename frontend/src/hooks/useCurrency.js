import { useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';

export const useCurrency = () => {
  const { settings } = useSettings();
  const currency = settings?.commerce?.currencyCode || 'EUR';
  const locale = settings?.commerce?.locale || 'en-IE';
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }),
    [locale, currency]
  );
  const formatMoney = useCallback(
    (value, currencyOverride = currency) => currencyOverride === currency
      ? formatter.format(Number(value || 0))
      : new Intl.NumberFormat(locale, { style: 'currency', currency: currencyOverride }).format(Number(value || 0)),
    [formatter, locale, currency]
  );
  return {
    currency,
    locale,
    currencySymbol: formatter.formatToParts(0).find((part) => part.type === 'currency')?.value || currency,
    formatMoney,
    commerce: settings?.commerce || {},
  };
};
