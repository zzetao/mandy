const moment = require('moment');

module.exports = mandy => {
  return {
    deployInfo: () => {
      let { log, config } = mandy;

      // 输出部署信息
      log.g('\n🛠  部署信息：');
      log.g(
        `
  > 部署环境：${config.env}
  > 部署服务器：${config.ssh.username}@${config.ssh.host}
  > 待发布文件大小：${config.releaseSize} bytes
  > 待发布文件创建时间：${config.releaseCreateTime}
  > 待发布文件路径：${config.workspace}
  > 线上部署路径：${config.deployTo}
  > 发布版本名称：${config.releaseDirname}
  > 操作人：${config.author}
      `
      );

      // 提醒
      log.g(
        `
💬  部署要求：

  ███╗   ███╗ █████╗ ███╗   ██╗██████╗ ██╗   ██╗
  ████╗ ████║██╔══██╗████╗  ██║██╔══██╗╚██╗ ██╔╝
  ██╔████╔██║███████║██╔██╗ ██║██║  ██║ ╚████╔╝ 
  ██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║  ╚██╔╝  
  ██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝   ██║   
  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝    ╚═╝   

                - 自定义提醒 - 
      `
      );
      log.g('✨  Good luck! ✨\n');
    },

    rollbackInfo: () => {
      let { log, config } = mandy;
      let { serverCurrentRelease, serverReleases } = config;

      let currentReleaseTime = moment(serverCurrentRelease, 'YYYYMMDDHHmmss').format('MM-DD hh:mm:ss');

      let selectReleaseList = "\n";
      for(let i = 0, len = serverReleases.length; i < len; i++) {
        let release = serverReleases[i];
        let formatDate = moment(release, 'YYYYMMDDHHmmss').format('MM-DD hh:mm:ss');
        let wrap = i%3 === 0 ? '\n' : '';
        selectReleaseList += `[${i+1}] ${release} (${formatDate}) ${wrap}`;
      }

      // 输出回滚信息
      log.g('\n🛠  回滚信息：');
      log.g(
        `
  > 回滚环境：${config.env}
  > 回滚服务器：${config.ssh.username}@${config.ssh.host}
  > 当前版本：${config.serverCurrentRelease} (${currentReleaseTime})
  > 线上部署路径：${config.deployTo}
  > 操作人：${config.author}
      `);
      log.g('\n📦  可回滚版本:');
      log.g(selectReleaseList)

    }
  };
};