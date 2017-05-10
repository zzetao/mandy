const core = require('./lib/core'),
			SSH = require('./lib/ssh'),
			fs  = require('fs'),
			argv = require('yargs').argv,
			path = require('path');

const utils = require('./lib/utils'),
			log = require('./lib/log'),
			tips = require('./lib/tips'),
			Deploy = require('./deploy'),
			Rollback = require('./rollback');

const { isObject, isFunction, getDirSize, getDirCreateTime } = utils;

let action = argv._[0],
		env = argv._[1];

class Mandy {
	constructor(config) {
		// plugins
		this.use('log', log);
		this.use('utils', utils);
		this.use('core', core(this));
		this.use('tips', tips(this));

		this.use('deploy', Deploy);
		this.use('rollback', Rollback);

		// 检查 config 完善性
		if (!isObject(config)) {
			return this.log.err('不是有效的配置文件');
		}
		if (!isObject(config.ssh)) {
			return this.log.err('ssh 信息没有配置');
		}
		if (!config.workspace) {
			return this.log.err('待发布文件夹没有配置');
		}
		if(!fs.existsSync(config.workspace)) {
			return this.log.err(`待发布文件夹不存在: ${config.workspace}`);
		}
		if (!config.deployTo) {
			return this.log.err('线上部署目录没有配置');
		}

		this.init(config);
	}

	init(config) {
		config.workspace = path.resolve(config.workspace);

		let defaultConfig = {
			env,
			author: this.core.author(),
			releaseSize: getDirSize(config.workspace),
			releaseCreateTime: getDirCreateTime(config.workspace), // todo ...
			releaseDirname: this.core.generateReleaseDirname()
		};
		let ssh = new SSH(config.ssh, conn => {
			// log.g('🔗  ssh 连接成功');
		});

		// ssh.then(res => {})
		// .catch(err => {
		// 	throw this.log.err(err);
		// })
		this.config = Object.assign(config, defaultConfig);
		this.connection = ssh;

	}

	use(name, obj) {
		this[name] = isFunction(obj) ? obj.bind(this, this) : obj;
	}
}

module.exports = Mandy;