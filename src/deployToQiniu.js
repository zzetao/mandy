const request = require('request-promise');
const _ = require('lodash');

module.exports = async mandy => {
  /**
   * 1 ->   [a, b, c]
   * 2 ->   [a, b, d]    -> [a, b, c, d]
   * 3 ->   [a, b, e]    -> [a, b, e, d]  -> del: [c]
   * 
   * .mandy 存储了上一版本和当前版本的文件名列表
   * 
   * {
   *    "prev": [],
   *    "current": []
   * }
   * 
   * currentReleaseFiles  当前版本文件列表
   * prevReleaseFiles 上一版本文件列表
   * 
   * 
   * 
   */

  // 1. 获取七牛云当前文件信息
  // 2. 正在合并文件列表
  // 3. 上传当前版本文件
  // 4. 删除上一版本文件
  // 5. 记录文件信息到 .mandy
  // 6. 上传完成
  
  let {
    prev: prevFiles = [],
    current: currentFiles = []
  } = await getMandyFile();

  let releaseFiles = [];

  let { uploadFiles, deleteFiles } = await extractFiles(prevFiles, currentFiles, releaseFiles);
  
  /**
   * 获取文件列表
   */
  async function getMandyFile() {
    let remotePath = path.join(mandy.config.qiniuDeployTo, '.mandy');
    let mandyFileDownloadUrl = mandy.qiniu.getPublicDownloadUrl(remotePath);

    // 请求 mandyFile 内容
    return request({
      uri: mandyFileDownloadUrl,
      json: true
    }).catch(err => {
      return { prev: [], current: [] }
    })
    // 返回 mandyFile 内容
  }

  /**
   * 提取文件列表
   * @param {Array<string>} prevFiles 上一版本文件列表
   * @param {Array<string>} currentFiles 当前线上的文件列表
   * @param {Array<string>} releaseFiles 等待发布的文件列表
   */
  function extractFiles(prevFiles, currentFiles, releaseFiles) {
    /**
     * 
     * let prevFiles = [1, 2, 3, 4]
     * let currentFiles = [1, 2, 5, 6]
     * let releaseFiles = [1, 2, 7, 8]
     * 
     * deleteFiles:
     * _.difference(prevFiles, currentFiles)  // [3, 4]
     * 
     * uploadFiles:
     * _.difference(releaseFiles, currentFiles)  // [7, 8]
     * 
     */
    let deleteFiles = _.difference(prevFiles, currentFiles);
    let uploadFiles = _.difference(releaseFiles, currentFiles);
    
    // 返回最终要上传的文件列表
    return {
      uploadFiles,
      deleteFiles
    };
  }

  /**
   * 删除旧的文件
   * @param {Array<string>} deleteFiles 待删除文件列表
   */
  async function deleteOldFiles(deleteFiles) {

  }

  /**
   * 上传新的文件
   * @param {Array<string>} uploadFiles 待上传文件列表
   */
  async function uploadReleaseFiles(uploadFiles) {

  }

  /**
   * 记录文件列表
   * @param {Array<string>} currentFiles 当前线上的文件列表
   * @param {Array<string>} releaseFiles 等待发布的文件列表
   */
  async function writeMandyFile(currentFiles, releaseFiles) {

  }
}