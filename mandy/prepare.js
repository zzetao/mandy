module.exports = {
	ssh: {
		host: 'images.zzetao.com',
		username: 'root',
		password: 'zhuang564123@vps',
		// privateKey: '/Users/zzetao/.ssh/id_rsa'
		// 更多配置：https://github.com/mscdex/ssh2#client-methods
	},
	// {相对路径}  当前目录; 编译后的文件，将要上传到线上
	workspace: 'bin',
	// {绝对路径}  线上部署目录
	deployTo: '/var/www/front_end/github.com',
	// {Number}  保存历史版本数量
	keepReleases: 10
}
