const shell = require('shelljs'),
  read = require('read'),
  moment = require('moment'),
  packageJSON = require('../../package.json');

module.exports = function(mandy) {
  /**
   * 生成版本目录名称
   * @return {String}  目录名称
   */
  function generateReleaseDirname() {
    return moment().format('YYYYMMDDHHmmss');
  }

  /**
   * 获取姓名
   * @return string
   */
  function author() {
    let localGitUserName = shell.exec('git config user.name', { silent: true });
    return localGitUserName
      ? (localGitUserName || '').trim()
      : packageJSON.name;
  }

  function randomCode() {
    let randomCode = Math.floor(Math.random() * 10001);
    return new Promise((resolve, reject) => {
      read({ prompt: '请输入随机验证码: [' + randomCode + ']' }, (err, code) => {
        if (randomCode != code) {
          mandy.connection && mandy.connection.dispose();
          mandy.log.g('\n 🤖  验证码错误，请重试  \n');
          reject(err, code);
          return process.exit();
        }

        resolve();
      });
    });
  }

  function inputReleaseSN() {
    let { serverReleases } = mandy.config;

    return new Promise((resolve, reject) => {
      read({ prompt: '请输入回滚版本序号: '}, (err, sn) => {
        let release = serverReleases[sn];
        if (!release) {
          return reject('请选择正确的序号');
        }
        
        read({ prompt: `确定回滚该版本? [${sn}] (Y/N): `}, (err, yes) => {
          if (['y', 'Y'].indexOf(yes) === -1) {
            return reject('取消回滚操作');
          }

          resolve(release);
        })
      })
    })
  }

  return {
    generateReleaseDirname,
    author,
    randomCode,
    inputReleaseSN
  };
};