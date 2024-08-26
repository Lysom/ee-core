'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto')
const chalk = require('chalk');
const Utils = require('../lib/utils');

/**
 * 增量升级
 * @class
 */

module.exports = {
  
  /**
   * 执行
   */  
  run(options = {}) {
    console.log('[ee-bin] [updater] Start');
    const { config } = options;
    const binCfg = Utils.loadConfig(config);
    const cfg = binCfg.updater;

    if (!cfg) {
      console.log(chalk.blue('[ee-bin] [updater] ') + chalk.red(`Error: ${cfg} config does not exist`));
      return;
    }
    console.log(chalk.blue('[ee-bin] [updater] ') + chalk.green('config:'), cfg);

    this.generateFile(cfg);

    console.log('[ee-bin] [updater] End');
  },

  generateFile(cfg) {
    const latestVersionInfo = {}
    const homeDir = process.cwd();
    const asarFilePath = path.normalize(path.join(homeDir, cfg.asarFile));
    if (!fs.existsSync(asarFilePath)) {
      console.log(chalk.blue('[ee-bin] [updater] ') + chalk.red(`Error: ${asarFilePath} does not exist`));
      return;
    }

    const sha1 = this.generateSha1(asarFilePath);
    const packageJson = Utils.getPackage();
    const version = packageJson.version;
    const date = this._getFormattedDate();
    const fileStat = fs.statSync(asarFilePath);

    for (const item of cfg.platform) {
      latestVersionInfo[item] = {
        version: version,
        file: 'app.zip',
        size: fileStat.size,
        sha1: sha1,
        releaseDate: date,
      };
    }

    const updaterJsonFilePath = path.join(homeDir, cfg.outFile);
    Utils.writeJsonSync(updaterJsonFilePath, latestVersionInfo);
  },
  
  generateSha1(filepath = "") {
    let sha1 = '';
    if (filepath.length == 0) {
      return sha1;
    }

    if (!fs.existsSync(filepath)) {
      return sha1;
    }

    console.log(chalk.blue('[ee-bin] [updater] ') + `generate sha1 for filepath:${filepath}`);
    try {
      const buffer = fs.readFileSync(filepath);
      const fsHash = crypto.createHash('sha1');
      fsHash.update(buffer);
      sha1 = fsHash.digest('hex');
      return sha1;

    } catch (error) {
      console.log(chalk.blue('[ee-bin] [updater] ') + chalk.red(`Error: generate sha1 error!`));
      console.log(chalk.blue('[ee-bin] [updater] ') + chalk.red(`Error: ${error}`));
    }
    return sha1;
  },

  _getFormattedDate() {
    const date = new Date(); // 获取当前日期
    const year = date.getFullYear(); // 获取年份
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 获取月份，月份从0开始计数
    const day = date.getDate().toString().padStart(2, '0'); // 获取日
  
    return `${year}-${month}-${day}`; 
  }
}