const Reporter = require('./lib/reporter'),
  moment = require('moment'),
  path = require('path');

module.exports = mandy => {
  let { log, config, core, connection, utils, tips } = mandy;
  let { inputReleasesSN } = core;

  let reporter = new Reporter('Get current release');
  let serverReleases = getReleases();
  let serverCurrentRelease = getCurrentRelease();

  if (!serverReleases || serverReleases.length === 0) {
    log.err('🤖  回滚失败，无可用的回滚版本');
  }

  mandy.config = Object.assign(mandy.config, {
    serverCurrentRelease,  // 当前版本
    serverReleases
  })

  tips.rollbackInfo();
  inputReleasesSN().then(release => {
    console.log(release)
  })
  
  /**
   * 获取所有版本
   * @return {Array}
   */
  async function getReleases() {
    let command = `ls -r ${config.deployToWorkspace}/releases`;
    let releases = await connection.exec(command).then(res => {
      let { stdout, stderr } = res;
      if (stderr) {
        throw log.err(stderr);
      }

      let result = stdout.split("\n");
      result.pop();  // 删除最后一个空字符串
      return result;
    })

    return releases;
  }

  /**
   * 获取当前版本
   * @return {String}
   */
  async function getCurrentRelease() {
    let command = `readlink ${config.deployTo} `;
    let release = await connection.exec(command).then(res => {
      let { stdout, stderr } = res;
      if (stderr) {
        throw log.err(stderr);
      }
      reporter.stop();
      return stdout
    });


    return path.basename(release)
  }
}