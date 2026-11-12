// Nascer e pôr do sol (algoritmo simplificado do NOAA / SunCalc). Retorna Date (UTC).
const rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009;
const e = rad * 23.4397;
const toDays = (date) => date.valueOf() / dayMs - 0.5 + J1970 - J2000;
const fromJulian = (j) => new Date((j + 0.5 - J1970) * dayMs);
const meanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
const eclipticLon = (M) =>
  M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
const approxTransit = (Ht, lw, n) => J0 + (Ht + lw) / (2 * Math.PI) + n;
const transitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);

export function sunTimes(date, lat, lon) {
  const lw = rad * -lon, phi = rad * lat;
  const d = toDays(date);
  const n = Math.round(d - J0 - lw / (2 * Math.PI));
  const ds = approxTransit(0, lw, n);
  const M = meanAnomaly(ds), L = eclipticLon(M);
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const noon = transitJ(ds, M, L);
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosW < -1 || cosW > 1) return { sunrise: null, sunset: null };
  const set = transitJ(approxTransit(Math.acos(cosW), lw, n), M, L);
  return { sunrise: fromJulian(noon - (set - noon)), sunset: fromJulian(set) };
}
