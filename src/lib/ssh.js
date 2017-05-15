const ssh2 = require('ssh2'), connection = new ssh2(), log = require('./log');

let { generateCallback, isObject, isArray } = require('./utils');

class SSH {
  constructor(config, callback) {
    this.ssh = this.init(config, callback);

    return {
      exec: this.exec.bind(this),
      dispose: this.dispose.bind(this),
      putFile: this.putFile.bind(this),
      putFiles: this.putFiles.bind(this),
      requestSFTP: this.requestSFTP.bind(this)
    };
  }

  init(config, callback) {
    return new Promise((resolve, reject) => {
      connection.connect(config);

      connection.on('error', err => {
        throw log.err(err.toString());
      });
      connection.on('ready', () => {
        connection.removeListener('error', reject);
        callback && callback(connection);
        resolve(connection);
      });
      connection.on('end', () => {});
    });
  }

  exec(command) {
    return new Promise((resolve, reject) => {
      this.ssh
        .then(res => {
          const output = { stdout: [], stderr: [] };
          res.exec(
            command,
            generateCallback(stream => {
              stream.on('data', chunk => {
                output.stdout.push(chunk);
              });
              stream.stderr.on('data', function(chunk) {
                output.stderr.push(chunk);
              });
              stream.on('close', (code, signal) => {
                resolve({
                  code,
                  signal,
                  stdout: output.stdout.join('').trim(),
                  stderr: output.stderr.join('').trim()
                });
              });
            }, reject)
          );
        })
        .catch(reject);
    });
  }

  requestSFTP() {
    return new Promise((resolve, reject) => {
      this.ssh.then(res => {
        res.sftp(generateCallback(resolve, reject));
      });
    });
  }

  putFile(localPath, remotePath, options = {}, sftp) {
    sftp = sftp ? sftp : this.requestSFTP();
    return new Promise((resolve, reject) => {
      sftp.then(res => {
        res.fastPut(localPath, remotePath, options, err => {
          if (err) {
            console.log('put file err: ', localPath, remotePath);
            return reject(err);
          }
          resolve(remotePath);
        });
      });
    });
  }

  putFiles(files, options = {}) {
    if (!isArray(files)) {
      throw console.log('putFiles: files must be an array');
    }
    for (let i = 0, len = files.length; i < len; i++) {
      let file = files[i];
      if (
        typeof file.localPath !== 'string' ||
        typeof file.remotePath !== 'string'
      ) {
        throw console.log('putFiles: localPath | remotePath must be an object');
      }
    }

    let sftp = this.requestSFTP();
    return Promise.all(
      files.map(file =>
        this.putFile(file.localPath, file.remotePath, options, sftp)
      )
    );
  }

  dispose() {
    this.ssh.then(res => {
      res.end();
    });
  }
}

module.exports = SSH;