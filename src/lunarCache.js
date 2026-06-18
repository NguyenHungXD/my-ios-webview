// Cache wrapper cho amlich — tránh gọi convertSolar2Lunar / jdFromDate nhiều lần

const amlich = require('amlich');

export function createCache() {
  const _lunarMap = new Map();
  const _jdMap = new Map();

  function dateKey(y, m, d) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  return {
    getLunar(dateStrOrY, m, d) {
      const key = m !== undefined ? dateKey(dateStrOrY, m, d) : dateStrOrY;
      if (_lunarMap.has(key)) return _lunarMap.get(key);
      let y, mm, dd;
      if (m !== undefined) {
        y = dateStrOrY; mm = m; dd = d;
      } else {
        [y, mm, dd] = key.split('-').map(Number);
      }
      const result = amlich.convertSolar2Lunar(dd, mm, y, 7);
      const safeResult = (result && Array.isArray(result) && result.length >= 3) ? result : [1, 1, 1900, 0];
      _lunarMap.set(key, safeResult);
      return safeResult;
    },

    getJD(dateStrOrY, m, d) {
      const key = m !== undefined ? dateKey(dateStrOrY, m, d) : dateStrOrY;
      if (_jdMap.has(key)) return _jdMap.get(key);
      let y, mm, dd;
      if (m !== undefined) {
        y = dateStrOrY; mm = m; dd = d;
      } else {
        [y, mm, dd] = key.split('-').map(Number);
      }
      const jd = amlich.jdFromDate(dd, mm, y);
      const safeJd = (typeof jd === 'number' && !isNaN(jd)) ? jd : 2459580;
      _jdMap.set(key, safeJd);
      return safeJd;
    },

    precomputeMonth(year, month) {
      const lastDay = new Date(year, month, 0).getDate();
      for (let day = 1; day <= lastDay; day++) {
        const key = dateKey(year, month, day);
        if (!_lunarMap.has(key)) {
          const lunar = amlich.convertSolar2Lunar(day, month, year, 7);
          _lunarMap.set(key, (lunar && Array.isArray(lunar) && lunar.length >= 3) ? lunar : [1, 1, year, 0]);
        }
        if (!_jdMap.has(key)) {
          _jdMap.set(key, amlich.jdFromDate(day, month, year));
        }
      }
    },

    clear() { _lunarMap.clear(); _jdMap.clear(); }
  };
}
