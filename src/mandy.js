const fs = require('fs'),
  argv = require('yargs').argv,
  path = require('path');

const utils = require('./lib/utils'),
  log = require('./lib/log'),
  tips = require('./lib/tips'),
  core = require('./lib/core'),
  SSH = require('./lib/ssh'),
  Qiniu = require('./lib/qiniu');

const Deploy = require('./deploy'),
      Rollback = require('./rollback'),
      Current = require('./current'),
      DeployToQiniu = require('./deployToQiniu');

const { isObject, isFunction, getDirSize, getDirCreateTime } = utils;

let action = argv._[0], env = argv._[1];

class Mandy {
  constructor(config) {
    this._events = {};
    this._initialized = false;

    this.connection = null; // ssh
    this.qiniu = null; // qiniu
    
    this.log = log;
    this.utils = utils;
    this.tips = tips(this);
    this.core = core(this);

    this.task('deploy', Deploy);
    this.task('rollback', Rollback);
    this.task('current', Current);
    this.task('deployToQiniu', DeployToQiniu);

    // 检查 config 完善性
    if (!isObject(config)) {
      return this.log.err('不是有效的配置文件');
    }
    if (!isObject(config.ssh) && !isObject(config.qiniu)) {
      return this.log.err('请配置 ssh 或 qiniu');
    }
    if (!config.workspace) {
      return this.log.err('待发布文件夹没有配置');
    }
    if (!fs.existsSync(config.workspace)) {
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
      author: this.core.getAuthorName(),
      releaseSize: getDirSize(config.workspace),
      releaseCreateTime: getDirCreateTime(config.workspace), // todo ...
      releaseDirname: this.core.generateReleaseDirname(),
      deployToWorkspace: `.${config.deployTo}-mandy`,
      deployToBasename: path.basename(config.deployTo)
    };

    this.config = Object.assign(config, defaultConfig);

    const customConfig = getCustomConfig('mandy.config.js');
    this.customConfig = isObject(customConfig) ? customConfig : {};

    const { ssh: sshConfig = {}, qiniu: qiniuConfig = {} } = this.config;
    
    let hasSshConfig = Object.keys(sshConfig).length > 0;
    let hasQiniuConfig = Object.keys(qiniuConfig).length > 0;

    if (hasQiniuConfig) {
      this._qiniuInit(qiniuConfig);
      this._initComplete();
    }
    
    if (hasSshConfig) {
      if (
        !this.config.ignorePassword &&
        !sshConfig.password &&
        !sshConfig.privateKey
      ) {
        // 用户需要输入 ssh 密码
        this.core
          .inputSshPassword()
          .then(password => {
            this.config.ssh.password = password;
            this._sshInit(this.config.ssh);
            this._initComplete();
          })
          .catch(err => {
            this.log.err(err);
          });
      } else {
        this._initComplete();
      }
    }
  }

  task(name, callback) {
    if (!name) {
      this.log.err('task name must be a string');
    }
    if (!isFunction(callback)) {
      this.log.err('task callback must be a function');
    }

    if (!this._events[name]) {
      this._events[name] = [];
    }
    this._events[name].push(callback);
  }

  run(name) {
    // 如果 mandy 还没初始化完成，先放到队列中，等待初始化完成后执行
    if (!this._initialized) {
      let events = this._events[name];
      for (let i = 0, len = events.length; i < len; i++) {
        this.task('init:done', events[i]);
      }
      events = [];
      return;
    }

    let events = this._events[name] || [];
    for (let i = 0, len = events.length; i < len; i++) {
      let fn = events.shift();
      fn.call(this, this);
    }
  }

  _sshInit(sshConfig) {
    this.connection = new SSH(sshConfig);
  }

  _qiniuInit(qiniuConfig) {
    this.qiniu = new Qiniu({
      bucket: qiniuConfig.bucket,
      accessKey: qiniuConfig.accessKey,
      secretKey: qiniuConfig.secretKey,
      bucketDomain: qiniuConfig.bucketDomain
    });
  }

  _initComplete() {
    this._initialized = true;
    this.run('init:done');
  }
}

function getCustomConfig(fileName) {
  try {
    let configPath = path.resolve(fileName);
    return require(configPath);
  } catch (e) {
    // todo
  }
}

module.exports = Mandy;
