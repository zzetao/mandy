const Reporter = require('./lib/reporter'),
  moment = require('moment'),
  path = require('path');

module.exports = mandy => {
  let { log, config, core, connection, utils, tips } = mandy;
  let { inputReleaseSN } = core;

  let reporter = new Reporter('Get current release');
  startRollback()
    .then(release => {
      console.log('');
      reporter.log = '>> 🤗  Rollback start ~';
      reporter.text = `Rollback to this version: ${release}`;
      return updateSymbolicLink(release);
    })
    .then(release => {
      reporter.text = 'Write Rollback Log';
      return writeRollbackLog(release);
    })
    .then(res => {
      reporter.succeed('Rollback Done!');
      mandy.connection.dispose();
    })
    .catch(log.err);

  async function startRollback() {
    let serverReleases = await getReleases();
    let serverCurrentRelease = await getCurrentRelease();
    reporter.stop();

    if (!serverReleases || serverReleases.length === 0) {
      log.err('🤖  回滚失败，无可用的回滚版本');
    }

    // 过滤当前版本
    serverReleases = serverReleases.filter(
      release => release != serverCurrentRelease
    );

    mandy.config = Object.assign(mandy.config, {
      serverCurrentRelease, // 当前版本
      serverReleases
    });

    tips.rollbackInfo(); // 显示信息

    return inputReleaseSN();
  }

  function writeRollbackLog(rollbackReleaseName) {
    // 日志路径
    let deployLogPath = `${config.deployToWorkspace}/deploy.log`;

    // 获取回滚版本的部署日志
    // 查找是部署的日志且反查出一行
    let getDeployLogCommand = `grep "^\\[2" ${deployLogPath} | grep "${rollbackReleaseName}" | tail -1`;
    let getVersionCommand = `cd ${config.deployToWorkspace} && if [ -f VERSION ]; then cat VERSION; fi`;

    return (
      Promise.all([
        connection.exec(getDeployLogCommand),
        connection.exec(getVersionCommand)
      ])
        .then(res => {
          let [logRes, versionRes] = res;
          let { stdout: logStdout, stderr: logStderr } = logRes;
          let { stdout: versionStdout, stderr: versionStderr } = versionRes;
          if (logStderr || versionStderr) {
            throw log.err(logStderr || versionStderr);
          }

          let releaseDeployLog = logStdout.toString().trim();
          let version = versionStdout.toString().trim() || 0;
          ++version;

          let time = moment().format('YYYY-MM-DD HH:mm:ss');
          let newReleaseDeployLog = `[Rollback] Time: ${time} Author: ${config.author} Version: ${version} -> ${releaseDeployLog}`;

          return [version, newReleaseDeployLog];
        })
        // 写入新的日志
        .then(res => {
          let [version, newReleaseDeployLog] = res;

          let command = `echo "${newReleaseDeployLog}" >> ${deployLogPath} && echo ${version} > ${config.deployToWorkspace}/VERSION`;
          return connection.exec(command).then(res => {
            reporter.log = `>> 📝  Deploy log record`;
          });
        })
    );
  }

  function updateSymbolicLink(rollbackReleaseName) {
    let prevPath = path.resolve(config.deployTo, '../');
    let currentRelease = path.resolve(
      config.deployToWorkspace,
      `releases/${rollbackReleaseName}`
    );
    let command = `cd ${prevPath} && ln -nfs ${currentRelease} ${config.deployToBasename}`;
    return connection.exec(command).then(res => {
      let { stdout, stderr } = res;
      if (stderr) {
        throw log.err(stderr);
      }
      reporter.log = `>> 🔨  Symbolic link: releases/${rollbackReleaseName} -> ${config.deployToBasename} `;

      return rollbackReleaseName;
    });
  }

  /**
   * 获取所有版本
   * @return {Promise} -> {Array}
   */
  async function getReleases() {
    let command = `ls -r ${config.deployToWorkspace}/releases`;
    let releases = await connection.exec(command).then(res => {
      let { stdout, stderr } = res;
      if (stderr) {
        throw log.err(stderr);
      }
      let result = stdout.split('\n');
      return result;
    });

    return releases;
  }

  /**
   * 获取当前版本
   * @return {Promise} -> {String}
   */
  async function getCurrentRelease() {
    let command = `readlink ${config.deployTo} `;
    let release = await connection.exec(command).then(res => {
      let { stdout, stderr } = res;
      if (stderr) {
        throw log.err(stderr);
      }

      return stdout;
    });

    return path.basename(release);
  }
};