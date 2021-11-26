const path = require('path');

module.exports = (env) => {
  return ['fonts', 'images', 'plugins', 'manifest', 'sw'].map((item) => {
    let obj = {
      from: path.resolve('.', `src/${item}`),
      to: `./${item}`,
      noErrorOnMissing: true,
    };
    if (item === 'manifest') {
      obj = {
        from: path.resolve('.', `src/manifest.json`),
        to: `./`,
        noErrorOnMissing: true,
      };
    } else if (item === 'sw' && env === 'pwa') {
      obj = {
        from: path.resolve('.', `src/sw/sw.js`),
        to: `./`,
        noErrorOnMissing: true,
      };
    }
    return obj;
  });
};
