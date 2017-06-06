const Reporter = require('./lib/reporter'),
  moment = require('moment'),
  path = require('path');

const Table = require('cli-table');

module.exports = mandy => {
  let { log, config, core, connection, utils, tips } = mandy;
  let reporter = new Reporter('Get current release');
  const deployFlag = '[Deploy]';
  const RollbackFlag = '[Rollback]';

  getCurrentLog()
    .then(res => {
      mandy.connection.dispose();
    })
    .catch(log.err)

  function getCurrentLog() {
    // 获取最后一行
    let command = `tail -1 ${config.deployToWorkspace}/mandy.log`;
    return connection.exec(command)
      .then(res => {
        let { stdout, stderr } = res;
        if (stderr) {
          throw log.err(stderr);
        }
        reporter.stop();

        let line = stdout.toString().trim();
        if (!line) {
          log.err('🤖 没有找到当前版本');
        }

        const isDeployLog = line[1] === 'D';

        line = line.replace(isDeployLog ? deployFlag : RollbackFlag, '');

        const logCellArr = isDeployLog ? handleLog(line) : handleRollbackLog(line);

        if (isDeployLog) {
          let table = new Table({});
          logCellArr.map(cell => {
            table.push(cell)
          })
          log.g('\n🛠  Deploy log: ')
          console.log(table.toString() + '\n');
        } else {
          let rollbackTable = new Table({});
          let deployTable = new Table({});

          logCellArr.rollbackLog.map(cell => {
            rollbackTable.push(cell);
          });
          logCellArr.deployLog.map(cell => {
            deployTable.push(cell);
          })

          log.g('\n📦  Rollback log: ');
          console.log(rollbackTable.toString());
          log.g('                  👇                  ');
          log.g('🛠  Deploy log: ')
          console.log(deployTable.toString() + '\n');
        }



        return line;
      })
  }

  function handleLog(line) {
    return line.split(';')
               .filter(n => !!n)
               .map((cell, index) => {
                  return cell.split(': ');
               });
  }

  function handleRollbackLog(line) {
    let [rollbackLog, deployLog] = line.split(' -> ');
    
    deployLog = handleLog(deployLog.replace(deployFlag, ''));
    rollbackLog = handleLog(rollbackLog.replace(RollbackFlag, ''));

    return {
      deployLog,
      rollbackLog
    }
  }
}