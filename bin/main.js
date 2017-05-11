const path = require('path'),
			fs   = require('fs'),
			Mandy = require('../index.js'),
			shell = require('shelljs'),
			ora   = require('ora'),
			log = require('../src/lib/log.js');

module.exports = argms => {
	let { _, environment } = argms;
	let command = _[0];

	switch(command) {
		case 'generate':
			const spinner = ora('Generate file').start();
			let mandyPath = path.resolve('mandy');
			let configPath = path.resolve(mandyPath, `${environment}.js`)
			let templatePath = path.resolve(__dirname, '../template/template.js');

			if (fs.existsSync(configPath)) {
				return spinner.fail(`The configuration file already exists: ${environment}.js`);
			}

			shell.mkdir('-p', mandyPath);
			shell.cp('-R', templatePath, configPath);

			spinner.succeed('Generate complete');
			log.g(`\nPath: ${configPath}\n`);
			break;
		default:
			let config = getConfig(environment);
			const mandy = new Mandy(config);
			mandy[command]();
	}
};


function getConfig(env) {
	let envConfigPath = `mandy/${env}.js`;
	try {
		let fullConfigPath = path.resolve(envConfigPath);
		return require(fullConfigPath);
	} catch (e) {
		throw log.err(`找不到配置文件 -> ${envConfigPath}\n \n请使用命令生成：mandy generate ${env}`);
	}
}
