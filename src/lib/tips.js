module.exports = mandy => {
	
	return {
		deployInfo: () => {
			let { log, config } = mandy;

			// 输出部署信息
			log.g('\n🛠  部署信息：')
			log.g(`
  > 部署环境：${config.env}
  > 部署服务器：${config.ssh.username}@${config.ssh.host}
  > 待发布文件大小：${config.releaseSize} bytes
  > 待发布文件创建时间：${config.releaseCreateTime}
  > 待发布文件路径：${config.workspace}
  > 线上部署路径：${config.deployTo}
  > 发布版本名称：${config.releaseDirname}
  > 操作人：${config.author}
			`)

			// 提醒
			log.g('💬  部署要求：');
			log.g(`
	███╗   ███╗ █████╗ ███╗   ██╗██████╗ ██╗   ██╗
	████╗ ████║██╔══██╗████╗  ██║██╔══██╗╚██╗ ██╔╝
	██╔████╔██║███████║██╔██╗ ██║██║  ██║ ╚████╔╝ 
	██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║  ╚██╔╝  
	██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝   ██║   
	╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝    ╚═╝   

			- 自定义提醒 - 
			`)
			log.g('✨  Good luck! ✨\n');
		}
	}
}