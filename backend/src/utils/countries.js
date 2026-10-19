const europeanCountries = new Map([
  ['AT', 'Austria'], ['BE', 'Belgium'], ['BG', 'Bulgaria'], ['HR', 'Croatia'],
  ['CY', 'Cyprus'], ['CZ', 'Czechia'], ['DK', 'Denmark'], ['EE', 'Estonia'],
  ['FI', 'Finland'], ['FR', 'France'], ['DE', 'Germany'], ['GR', 'Greece'],
  ['HU', 'Hungary'], ['IE', 'Ireland'], ['IT', 'Italy'], ['LV', 'Latvia'],
  ['LT', 'Lithuania'], ['LU', 'Luxembourg'], ['MT', 'Malta'], ['NL', 'Netherlands'],
  ['PL', 'Poland'], ['PT', 'Portugal'], ['RO', 'Romania'], ['SK', 'Slovakia'],
  ['SI', 'Slovenia'], ['ES', 'Spain'], ['SE', 'Sweden'], ['IS', 'Iceland'],
  ['LI', 'Liechtenstein'], ['NO', 'Norway'], ['CH', 'Switzerland'], ['GB', 'United Kingdom'],
  ['AL', 'Albania'], ['BA', 'Bosnia and Herzegovina'], ['ME', 'Montenegro'], ['MK', 'North Macedonia'],
  ['RS', 'Serbia'], ['MD', 'Moldova'], ['UA', 'Ukraine'],
]);

export const normalizeEuropeanCountry = (countryCode, countryName = '') => {
  const suppliedName = String(countryName || '').trim();
  const codeFromName = [...europeanCountries.entries()].find(
    ([, name]) => name.toLowerCase() === suppliedName.toLowerCase()
  )?.[0];
  const code = String(countryCode || codeFromName || '').trim().toUpperCase();
  if (!europeanCountries.has(code)) {
    const error = new Error('Select a valid European delivery country');
    error.statusCode = 400;
    throw error;
  }
  return { countryCode: code, country: europeanCountries.get(code) || String(countryName).trim() };
};
