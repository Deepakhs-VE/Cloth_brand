const CACHE_MS = 24 * 60 * 60 * 1000;
const ZERO_DECIMAL_CURRENCIES = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

const isFresh = (cache, baseCurrency) => cache?.baseCurrency === baseCurrency
  && cache?.fetchedAt
  && Date.now() - new Date(cache.fetchedAt).getTime() < CACHE_MS
  && cache?.rates?.length;

export const roundMoney = (amount, currency) => {
  const digits = ZERO_DECIMAL_CURRENCIES.has(String(currency).toUpperCase()) ? 0 : 2;
  const factor = 10 ** digits;
  return Math.round((Number(amount) + Number.EPSILON) * factor) / factor;
};

export const getExchangeRates = async (settings, { force = false } = {}) => {
  const commerce = settings.commerce || {};
  const baseCurrency = String(commerce.baseCurrencyCode || 'EUR').toUpperCase();
  const cache = commerce.exchangeRateCache;
  if (!force && isFresh(cache, baseCurrency)) return { baseCurrency, rates: Object.fromEntries(cache.rates) };

  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) {
    const error = new Error('Exchange-rate service is not configured');
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/${baseCurrency}`);
  if (!response.ok) throw new Error('Exchange-rate provider is temporarily unavailable');
  const data = await response.json();
  if (data.result !== 'success' || !data.conversion_rates?.[baseCurrency]) throw new Error('Exchange-rate provider returned invalid rates');

  const rates = Object.entries(data.conversion_rates)
    .filter(([code, rate]) => /^[A-Z]{3}$/.test(code) && Number.isFinite(Number(rate)) && Number(rate) > 0);
  settings.commerce.exchangeRateCache = { baseCurrency, rates, fetchedAt: new Date(), provider: 'ExchangeRate-API' };
  await settings.save();
  return { baseCurrency, rates: Object.fromEntries(rates) };
};

export const convertFromBase = async (amount, settings) => {
  const currency = String(settings.commerce?.currencyCode || 'EUR').toUpperCase();
  const baseCurrency = String(settings.commerce?.baseCurrencyCode || 'EUR').toUpperCase();
  return convertCurrency(amount, baseCurrency, currency, settings);
};

export const convertCurrency = async (amount, fromCurrency, toCurrency, settings, { round = true } = {}) => {
  const source = String(fromCurrency || settings.commerce?.baseCurrencyCode || 'EUR').toUpperCase();
  const target = String(toCurrency || settings.commerce?.currencyCode || 'EUR').toUpperCase();
  if (source === target) return round ? roundMoney(amount, target) : Number(amount || 0);

  const { baseCurrency, rates } = await getExchangeRates(settings);
  const sourceRate = source === baseCurrency ? 1 : Number(rates[source]);
  const targetRate = target === baseCurrency ? 1 : Number(rates[target]);
  if (!Number.isFinite(sourceRate) || sourceRate <= 0 || !Number.isFinite(targetRate) || targetRate <= 0) {
    const error = new Error(`No exchange rate is available for ${source} or ${target}`);
    error.statusCode = 503;
    throw error;
  }

  const converted = (Number(amount || 0) / sourceRate) * targetRate;
  return round ? roundMoney(converted, target) : converted;
};
