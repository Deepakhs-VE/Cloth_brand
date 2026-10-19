export const europeanCountries = [
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
].map(([code, name]) => ({ code, name }));

export const europeanCountryOptions = europeanCountries.map(({ code, name }) => ({
  value: code,
  label: name,
}));

export const getEuropeanCountry = (code) => europeanCountries.find((country) => country.code === code);
