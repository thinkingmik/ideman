var ideman = require('../lib/index');

ideman.init({
  token: {
    life: 1600,
    length: 16
  }
});
var config = ideman.getConfig();

console.log(config.token);
