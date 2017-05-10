const Reporter = require('./lib/reporter'),
			moment = require('moment'),
			path = require('path');

module.exports = mandy => {
	let { log, config, core, connection, utils, tips } = mandy;
	let { randomCode } = core,
			reporter;

	tips.deployInfo();
	randomCode().then(() => {
		console.log()
		reporter = new Reporter('Deploy start...');
		reporter.log = '>> 🤗  Deploy start ~'
		startDeploy();
	})
	.catch((err, code) => {
		log.err('验证码错误')
	})


	function startDeploy() {

		reporter.text = 'Mkdir Release';
		return mkdirRelease()
		.then(res => {
			reporter.text = 'Upload Files';
			return uploadRelease()
		})
		.then(res => {
			reporter.text = 'Clear Old Release'
			return clearOldRelease()
		})
		.then(res => {
			reporter.text = 'Update Symbolic Link'
			return updateSymbolicLink()
		})
		.then(res =>{
			reporter.text = 'Write Deploy Log'
			return writeDeployLog()
		})
		.then(res => {
			reporter.succeed('Deploy Done!')
			mandy.connection.dispose();
		})
		.catch(err => {
			log.err(err)
		})
	}

  /**
   * [1] 建立文件夹
   */
	function mkdirRelease() {
	  let command = `mkdir -p ${config.deployTo}/releases/${config.releaseDirname}`;

	  return connection.exec(command)
			.then(res => {
				let { stdout, stderr } = res;
				if (stderr) {
					throw log.err(stderr);
				}
				reporter.log = `>> 📦  Create release path success: [${config.releaseDirname}]`;
			})
	}

  /**
   * [2] 上传待发布的文件
   */
	function uploadRelease() {
		let { workspace, releaseSize, deployTo, releaseDirname } = config;
		let { getDirs } = mandy.utils;

		let dir = workspace.replace(path.resolve() + '/', '');
		let { directorys, files } = getDirs(dir);

		let fileCount = files.length;

    reporter.log = `>> 🚀  Start upload publish file, size: ${releaseSize} bytes, ${fileCount} files`;

		if (directorys.length > 0 && fileCount > 0) {
			return mkdirDirectory(directorys).then(res => {
				return uploadFile(files);
			});
		} else {
			return uploadFile(files);
		}

		async function uploadFile(files) {
			let sftp = connection.requestSFTP();
			let startTime = new Date();
			for(let i = 0, len = fileCount; i < len; i++) {
				let file = files[i];
				let tempFilePath = file.replace(dir + '/', '');
				let remotePath = path.join(deployTo, 'releases', `${releaseDirname}`, tempFilePath);

				reporter.text = `Uploading ${i} of ${fileCount} files: ${tempFilePath}`;

				await connection.putFile(file, remotePath, {}, sftp)
			}

			let relativeTime = moment(startTime).fromNow();
	    reporter.log = `>> 👏  Upload complete (${relativeTime})`;
		}
		function mkdirDirectory(directorys) {
			let directoryJoin = directorys.map(dir => path.join(deployTo, 'releases',`${releaseDirname}`,  dir)).join(' ');
			let mkdirDirectoryCommand = `mkdir -p ${directoryJoin}`;
			return connection
				.exec(mkdirDirectoryCommand)
				.then(res => {
					let { stdout, stderr } = res;
					if (stderr) {
						throw log.err(stderr);
					}
				})
		}
	}
  /**
   * [3] 清除旧版本
   */
	function clearOldRelease() {
		let command = `(ls -rd ${config.deployTo}/releases/*|head -n ${config.keepReleases};ls -d ${config.deployTo}/releases/*)|sort|uniq -u|xargs rm -rf`;

	  return connection.exec(command)
	  	.then(res => {
				let { stdout, stderr } = res;
				if (stderr) {
					throw log.err(stderr);
				}
				reporter.log = `>> ⭐  Clean: Keeping "${config.keepReleases}" last releases, cleaning others`;
	  	})
	}

	function updateSymbolicLink() {
		let command = `cd ${config.deployTo} && ln -nfs releases/${config.releaseDirname} current`;
	  return connection.exec(command)
	  	.then(res => {
					let { stdout, stderr } = res;
					if (stderr) {
						throw log.err(stderr);
					}
		      reporter.log = `>> 🔨  Symbolic link: releases/${config.releaseDirname} -> current`;
	  	})
	}

	function writeDeployLog() {

      let deployTime = moment(config.releaseDirname, "YYYYMMDDHHmmss").format("YYYY-MM-DD HH:mm:ss");
      let command = `cd ${config.deployTo} && if [ -f VERSION ]; then cat VERSION; fi`;

      // 获取当前版本号
      return connection.exec(command)
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
	        let writeLogCommand = `echo "${line}" >> ${config.deployTo}/deploy.log && echo ${version} > ${config.deployTo}/VERSION`;
	        return connection.exec(writeLogCommand)
      	})
      	.then(res => {
					let { stdout, stderr } = res;
					if (stderr) {
						throw log.err(stderr);
					}
      		reporter.log = '>> 📝  Deploy log record';
      	})
	}


}