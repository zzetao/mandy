const colors = require('colors');

module.exports = {
  err(msg) {
    console.log('\n' + colors.green('[Mandy Error]: ' + msg) + '\n');
    process.exit();
  },
  g(msg) {
    console.log(colors.green(msg));
  }
};