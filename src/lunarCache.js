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
      _lunarMap.set(key, result);
      return result;
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
      _jdMap.set(key, jd);
      return jd;
    },

    precomputeMonth(year, month) {
      const lastDay = new Date(year, month, 0).getDate();
      for (let day = 1; day <= lastDay; day++) {
        const key = dateKey(year, month, day);
        if (!_lunarMap.has(key)) {
          const lunar = amlich.convertSolar2Lunar(day, month, year, 7);
          _lunarMap.set(key, lunar);
        }
        if (!_jdMap.has(key)) {
          _jdMap.set(key, amlich.jdFromDate(day, month, year));
        }
      }
    },

    clear() { _lunarMap.clear(); _jdMap.clear(); }
  };
}
