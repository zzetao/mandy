const fs = require('fs'),
			path = require('path'),
			shelljs = require('shelljs'),
			child_process = require('child_process'),
			moment = require('moment');

function generateCallback(resolve, reject) {
	return (err, res) => {
		if (err) {
			reject(err);
		} else {
			resolve(res);
		}
	}
}

/**
 * 获取文件夹大小
 * @param  {[type]} dir [description]
 * @return {[type]}     [description]
 */
function getDirSize(dir) {
	return shelljs
		.exec('du -s ' + dir, { silent: true })
		.toString()
		.replace(dir, '')
		.trim();
}

function getDirCreateTime(dir) {
	let createTime = fs.statSync(dir).birthtime;
	if (createTime) {
		let time = moment(createTime);
		let relativeTime = time.fromNow();
		let formatTime = time.format("YYYY-MM-DD hh:mm:ss");
		createTime = `${relativeTime} (${formatTime})`;
	}
	return createTime;
}

function getDirs(dirname) {
	let files = [];
	let directorys = [];
	let walk = function(dir) {
	    let list = fs.readdirSync(dir)
	    list.forEach(function(file) {
	        file = dir + '/' + file
	        let stat = fs.statSync(file)
	        if (stat && stat.isDirectory()) {
	        	directorys.push(file.replace(dirname + '/', ''));
						walk(file)
	        } else {
	        	files.push(file)
	        }
	    })
	}
	walk(dirname);

	return {
		files,
		directorys
	}
}


module.exports = {
	isObject(a) {
		return a !== null && typeof a === 'object';
	},
	isFunction(f) {
		return Object.prototype.toString.call(f) === '[object Function]';
	},
	isArray(a) {
		return Object.prototype.toString.call(a) === '[object Array]';
	},
	generateCallback,
	getDirSize,
	getDirCreateTime,
	getDirs
};