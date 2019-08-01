const moment = require('moment');
const Table = require('cli-table');

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
  > 操作人：${config.author}`
      );

      if (config.tips && config.tips.deployInfo) {
        log.g(config.tips.deployInfo)
      } else {
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

              ✨  Good luck! ✨
      `
        );
      }
    },

    rollbackInfo: () => {
      let { log, config } = mandy;
      let { serverCurrentRelease, serverReleases } = config;
      let releasesTable = new Table({
        head: ['sn', 'Release name', 'sn', 'Release name']
      });

      let currentReleaseTime = moment(serverCurrentRelease, 'YYYYMMDDHHmmss').format('MM-DD hh:mm:ss');
    
      let tempArr = [];
      for(let i = 0, len = serverReleases.length; i < len; i++) {
        let release = serverReleases[i];

        let formatDate = moment(release, 'YYYYMMDDHHmmss').format('MM-DD hh:mm:ss');
        let result = `${release} (${formatDate})`;
        tempArr.push(i + 1);
        tempArr.push(result);
        if (tempArr.length === 4) {
          releasesTable.push(tempArr);
          tempArr = [];
        }
      }
      tempArr.length > 0 && releasesTable.push(tempArr);

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

      if (config.tips && config.tips.rollbackInfo) {
        log.g(config.tips.rollbackInfo);
      }

      log.g('\n📦  可回滚版本:');
      console.log(releasesTable.toString())

    }
  };
};