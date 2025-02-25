'use strict';

const debug = require('debug')('ee-core-copy:config');
const path = require('path');
const extend = require('../../../../utils/extend');
const assert = require('assert');
const { Console } = require('console');

module.exports = {

  /**
   * Load config/config.js
   *
   * Will merge config.default.js 和 config.${env}.js
   *
   * @function EggLoader#loadConfig
   * @since 1.0.0
   */
  loadConfig() {
    this.timing.start('Load Config');
    this.configMeta = {};

    const target = {};

    // Load Application config first
    const appConfig = this._preloadAppConfig();

    for (const filename of this.getTypeFiles('config')) {
      for (const unit of this.getLoadUnits()) {
        const isApp = unit.type === 'app';
        const config = this._loadConfig(unit.path, filename, isApp ? undefined : appConfig, unit.type);

        if (!config) {
          continue;
        }

        debug('Loaded config %s, %s, %j', unit.path, filename, config);
        extend(true, target, config);
      }
    }

    // load env from process.env.EE_APP_CONFIG
    const envConfig = this._loadConfigFromEnv();
    debug('Loaded config from private env, %j', envConfig);
    extend(true, target, envConfig);

    // You can manipulate the order of app.config.coreMiddleware and app.config.appMiddleware in app.js
    target.coreMiddleware = target.coreMiddlewares = target.coreMiddleware || [];
    target.appMiddleware = target.appMiddlewares = target.middleware || [];

    this.config = target;
    this.timing.end('Load Config');
  },

  _preloadAppConfig() {
    const names = [
      'config.default',
      `config.${this.serverEnv}`,
    ];


    const target = {};
    for (const filename of names) {
      const config = this._loadConfig(this.options.baseDir, filename, undefined, 'app');
      extend(true, target, config);
    }
    return target;
  },

  _loadConfig(dirpath, filename, extraInject, type) {
    const isPlugin = type === 'plugin';
    const isApp = type === 'app';
    let filepath = this.resolveModule(path.join(dirpath, 'config', filename));

    // let config.js compatible
    // if (filename === 'config.default' && !filepath) {
    //   filepath = this.resolveModule(path.join(dirpath, 'config/config'));
    // }

    const config = this.loadFile(filepath, this.appInfo, extraInject);

    if (!config) return null;

    if (isPlugin || isApp) {
      assert(!config.coreMiddleware, 'Can not define coreMiddleware in app or plugin');
    }
    if (!isApp) {
      assert(!config.middleware, 'Can not define middleware in ' + filepath);
    }

    // store config meta, check where is the property of config come from.
    this._setConfigMeta(config, filepath);

    return config;
  },

  _loadConfigFromEnv() {
    const envConfigStr = process.env.EE_APP_CONFIG;
    if (!envConfigStr) return;
    try {
      const envConfig = JSON.parse(envConfigStr);
      this._setConfigMeta(envConfig, '<process.env.EE_APP_CONFIG>');
      return envConfig;
    } catch (err) {
      this.options.logger.warn('[ee-core] [core/.../config] process.env.EE_APP_CONFIG is not invalid JSON: %s', envConfigStr);
    }
  },

  _setConfigMeta(config, filepath) {
    config = extend(true, {}, config);
    setConfig(config, filepath);
    extend(true, this.configMeta, config);
  },
};

function setConfig(obj, filepath) {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    // ignore console
    if (key === 'console' && val && typeof val.Console === 'function' && val.Console === Console) {
      obj[key] = filepath;
      continue;
    }
    if (val && Object.getPrototypeOf(val) === Object.prototype && Object.keys(val).length > 0) {
      setConfig(val, filepath);
      continue;
    }
    obj[key] = filepath;
  }
}
