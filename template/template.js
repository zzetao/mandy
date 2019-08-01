module.exports = {
  ssh: {
    host: 'github.com',
    username: 'root',
    password: 'password',
    // privateKey: '/Users/zzetao/.ssh/id_rsa'
    // 更多配置：https://github.com/mscdex/ssh2#client-methods
  },
  keepReleases: 10,     // 保存历史版本数量
  workspace: 'build',   // {相对路径}  待发布文件目录
  deployTo: '/var/www/front_end/github.com',  // {绝对路径}  线上部署目录
  verify: true, // 是否需要输入验证码验证，默认true
}