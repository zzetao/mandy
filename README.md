# Mandy

📦 前端自动化部署工具
> 本项目为实验项目，不建议正式环境使用。部署前端项目建议结合 CI/CD 来做自动化。


![mandy-demo](https://cloud.githubusercontent.com/assets/8110936/25962458/7b49f6f6-36b0-11e7-87ee-fd8765a58aec.gif)



## 功能

- 可视化的部署流程
- 可交互的回滚流程
- 多个前端环境管理
- 无缝切换部署回滚




## 安装

```Bash
# 全局安装
yarn global add mandy

# 本地安装
yarn add mandy --dev
```

## 其他安装

```Bash
git clone 
npm link
```


## 使用

**命令格式**

```bash
mandy <command> <environment>
```

**命令列表**

- mandy deploy          //  部署
- mandy rollback       //  回滚
- mandy current        //  当前版本信息
- ···



### 开始部署

**Step 0: 生成配置文件**

进入你的项目，运行 `mandy generate`命令，创建配置文件

执行后，将在当前目录建立 `mandy/production.js  `配置文件

```bash
mandy generate production
```



**Step 1: 编辑配置文件**
> 建议将配置文件添加到 .gitignore，避免泄漏 ssh 信息

```javascript
// mandy/production.js
module.exports = {
  ssh: {
    host: 'github.com',
    username: 'root',
    password: 'password',
    // privateKey: '/Users/zzetao/.ssh/id_rsa'
    // 更多配置：https://github.com/mscdex/ssh2#client-methods
  },
  keepReleases: 10    // 保存历史版本数量
  workspace: 'build', // {相对路径}  本地待发布文件目录
  deployTo: '/var/www/front_end/github.com', // {绝对路径}  线上部署目录
  verify: true // 是否需要输入验证码验证，默认 true
  tips: {
    deployInfo: '部署时提示信息',
    rollbackInfo: '回滚时提示信息'
  }
}
```



**Setp 2: 开始部署**

执行 `mandy deploy` 命令执行部署任务

```bash
mandy deploy production
```



enjoy ~





## Todo

- !! 重构 !!
- ~~回滚版本~~
- ~~查看当前版本信息~~
- ~~任务驱动~~
- ~~部署到多台机器~~
- 更多自定义配置
- 完善文档
- 调整错误信息抛出



## License

MIT © zzetao