const core = require('./lib/core'),
  SSH = require('./lib/ssh'),
  fs = require('fs'),
  argv = require('yargs').argv,
  path = require('path');

const utils = require('./lib/utils'),
  log = require('./lib/log'),
  tips = require('./lib/tips'),
  Deploy = require('./deploy'),
  Rollback = require('./rollback'),
  Current = require('./current');

const { isObject, isFunction, getDirSize, getDirCreateTime } = utils;

let action = argv._[0], env = argv._[1];

class Mandy {
  constructor(config) {
    this._events = {};
    this._initDone = false;

    this.log = log;
    this.utils = utils;
    this.tips = tips(this);
    this.core = core(this);

    this.task('deploy', Deploy);
    this.task('rollback', Rollback);
    this.task('current', Current);

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
      author: this.core.author(),
      releaseSize: getDirSize(config.workspace),
      releaseCreateTime: getDirCreateTime(config.workspace), // todo ...
      releaseDirname: this.core.generateReleaseDirname(),
      deployToWorkspace: `${config.deployTo}-mandy`,
      deployToBasename: path.basename(config.deployTo)
    };

    this.config = Object.assign(config, defaultConfig);

    // @deprecated
    const customConfig = getCustomConfig('mandy.config.js');
    this.customConfig = utils.isObject(customConfig) ? customConfig : {};

    let runInitTask = () => {
      this._initDone = true;
      this.connection = new SSH(config.ssh);
      this.run('init:done');
    }

    const { ssh: sshConfig } = this.config;
    if (
      !this.config.ignorePassword &&
      !sshConfig.password &&
      !sshConfig.privateKey
    ) {
      this.core
        .inputSshPassword()
        .then(password => {
          this.config.ssh.password = password;
          runInitTask();
        })
        .catch(err => {
          this.log.err(err);
        });
    } else {
      runInitTask();
    }
  }

  task(name, callback) {
    if (!name) {
      this.log.err('task name must be a string');
    }
    if (!isFunction(callback)) {
      this.log.err('task callback must be a string');
    }

    if (!this._events[name]) {
      this._events[name] = [];
    }
    this._events[name].push(callback);
  }

  run(name) {
    if (!this._initDone) {
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
