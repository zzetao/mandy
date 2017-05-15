const Reporter = require('./lib/reporter'),
  moment = require('moment'),
  path = require('path');

module.exports = mandy => {
  let { log, config, core, connection, utils, tips } = mandy;
  let { randomCode } = core, reporter;

  // 部署信息
  tips.deployInfo();

  // 验证码
  randomCode()
    .then(() => {
      console.log();
      reporter = new Reporter('Deploy start...');
      reporter.log = '>> 🤗  Deploy start ~';

      startDeploy();
    })
    .catch((err, code) => {
      log.err('验证码错误');
    });

  /**
   * [0] Start
   */
  function startDeploy() {
    reporter.text = 'Mkdir Release';
    return mkdirRelease()
      .then(res => {
        reporter.text = 'Upload Files';
        return uploadRelease();
      })
      .then(res => {
        reporter.text = 'Clear Old Release';
        return clearOldRelease();
      })
      .then(res => {
        reporter.text = 'Update Symbolic Link';
        return updateSymbolicLink();
      })
      .then(res => {
        reporter.text = 'Write Deploy Log';
        return writeDeployLog();
      })
      .then(res => {
        reporter.succeed('Deploy Done!');
        mandy.connection.dispose();
      })
      .catch(err => {
        log.err(err);
      });
  }

  /**
   * [1] 建立文件夹
   */
  function mkdirRelease() {
    let command = `mkdir -p ${config.deployToWorkspace}/releases/${config.releaseDirname}`;

    return connection.exec(command).then(res => {
      let { stdout, stderr } = res;
      if (stderr) {
        throw log.err(stderr);
      }
      reporter.log = `>> 📦  Create release path success: [${config.releaseDirname}]`;
    });
  }

  /**
   * [2] 上传待发布的文件
   */
  function uploadRelease() {
    let { workspace, releaseSize, deployToWorkspace, releaseDirname } = config;
    let { getDirs } = mandy.utils;

    let workspaceBasename = path.resolve(workspace);

    // 获取待上传文件及目录数组
    let { directorys, files } = getDirs(workspaceBasename);

    let fileCount = files.length;

    reporter.log = `>> 🚀  Start upload publish file, size: ${releaseSize} bytes, ${fileCount} files`;

    if (directorys.length > 0 && fileCount > 0) {
      return mkdirDirectory(directorys).then(res => {
        return uploadFiles(files);
      });
    } else {
      return uploadFiles(files);
    }

    async function uploadFiles(files) {
      let sftp = connection.requestSFTP();
      let startTime = new Date();
      for (let i = 0, len = fileCount; i < len; i++) {
        let fileAbsolutePath = files[i];
        let fileRelativePath = fileAbsolutePath.replace(workspaceBasename + '/', '');

        // build/filename.html -> ${deployToWorkspace}/release/${releaseDirname}/filename.html
        let remotePath = path.join(
          deployToWorkspace,
          'releases',
          `${releaseDirname}`,
          fileRelativePath
        );

        reporter.text = `Uploading ${i+1} of ${fileCount} files: ${fileRelativePath}`;

        await connection.putFile(fileAbsolutePath, remotePath, {}, sftp);
      }

      let relativeTime = moment(startTime).fromNow();
      reporter.log = `>> 👏  Upload complete (${relativeTime})`;
    }

    /**
     * 批量建立文件夹
     * @param  {Array} directorys  目录数组
     * @return Promise
     */
    function mkdirDirectory(directorys) {
      /**
       *  ['folder1', 'folder2', 'folder3'] => 'folder1 folder2 folder3'
       */
      let directoryJoin = directorys
        .map(dir => path.join(deployToWorkspace, 'releases', `${releaseDirname}`, dir))
        .join(' ');
      let mkdirDirectoryCommand = `mkdir -p ${directoryJoin}`;
      return connection.exec(mkdirDirectoryCommand).then(res => {
        let { stdout, stderr } = res;
        if (stderr) {
          throw log.err(stderr);
        }
      });
    }
  }

  /**
   * [3] 清除旧版本
   */
  function clearOldRelease() {
    let command = `(ls -rd ${config.deployToWorkspace}/releases/*|head -n ${config.keepReleases};ls -d ${config.deployToWorkspace}/releases/*)|sort|uniq -u|xargs rm -rf`;

    return connection.exec(command).then(res => {
      let { stdout, stderr } = res;
      if (stderr) {
        throw log.err(stderr);
      }
      reporter.log = `>> ⭐  Clean: Keeping "${config.keepReleases}" last releases, cleaning others`;
    });
  }

  /**
   * [4] 更新软链
   */
  function updateSymbolicLink() {
    let prevPath = path.resolve(config.deployTo, '../');
    let currentRelease = path.resolve(
      config.deployToWorkspace,
      `releases/${config.releaseDirname}`
    );
    let command = `cd ${prevPath} && ln -nfs ${currentRelease} ${config.deployToBasename}`;
    return connection.exec(command).then(res => {
      let { stdout, stderr } = res;
      if (stderr) {
        throw log.err(stderr);
      }
      reporter.log = `>> 🔨  Symbolic link: releases/${config.releaseDirname} -> ${config.deployToBasename}`;
    });
  }

  /**
   * [5] 写入日志
   */
  function writeDeployLog() {
    let deployTime = moment(config.releaseDirname, 'YYYYMMDDHHmmss').format(
      'YYYY-MM-DD HH:mm:ss'
    );
    let command = `cd ${config.deployToWorkspace} && if [ -f VERSION ]; then cat VERSION; fi`;

    // 获取当前版本号
    return connection
      .exec(command)
      .then(res => {
        let { stdout, stderr } = res;
        if (stderr) {
          throw log.err(stderr);
        }
        let version = res.stdout.toString().trim() || 0;
        ++version;

        let line = `[${deployTime}] Author: ${config.author}; Release: ${config.releaseDirname}; Release Size: ${config.releaseSize} bytes; Version: ${version};`;

        // 写入新的日志到 deploy.log;
        // 写入当前版本号到 VERSION;
        let writeLogCommand = `echo "${line}" >> ${config.deployToWorkspace}/deploy.log && echo ${version} > ${config.deployToWorkspace}/VERSION`;
        return connection.exec(writeLogCommand);
      })
      .then(res => {
        let { stdout, stderr } = res;
        if (stderr) {
          throw log.err(stderr);
        }
        reporter.log = '>> 📝  Deploy log record';
      });
  }
};