const _ = require('lodash');
const aws4 = require('aws4');
const assert = require('assert');
const urllib = require('urllib');
const qs = require('querystring');
const HttpsError = require('http-errors');

class Client {
  /**
   * @link https://docs.ksyun.com/documents/1078
   */
  constructor(config = {}) {
    assert(config.apiVersion, 'must pass "config.apiVersion"');
    assert(config.accessKeyId, 'must pass "config.accessKeyId"');
    assert(config.secretAccessKey, 'must pass "config.secretAccessKey"');

    config = _.defaultsDeep(config, {
      host: 'kls.api.ksyun.com',
      region: 'cn-beijing-6',
    });

    this.Version = config.apiVersion;
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;

    this.service = 'kls';
    this.region = config.region;
    this.host = config.host;
    this.endpoint = 'https://' + this.host;
  }

  /**
   * http request 方法
   * @param {String} action 接口操作名
   * @param {Object} options
   * @param {Undefined|Object} options.userParams 金山云接口所需的参数，这里面可以不传 Action 和 Version
   * @param {Undefined|Object} [options.headers] http headers
   * @param {Undefined|Booolean} [options.raw] 是否返回原生信息
   */
  async request(action, options = {}) {
    const raw = options.raw;
    options = _.assign(options, this._getApi(action));
    options = this._handleRequest(action, options);
    options.timeout = [3000, 60000]; // 连接超时 3s，响应超时 60s

    // eslint-disable-next-line no-unused-vars
    let res = await urllib.request(options.url, options).catch(unusedError => {
      throw new HttpsError(500);
    });
    if (raw) {
      return res;
    }

    res = res.res;
    if (res.status === -1 || res.status === -2) {
      throw new HttpsError(res.status, res.statusMessage);
    }
    if (res.status > 399) {
      throw new HttpsError(res.status, _.get(res, 'data.Error.Message', res.statusMessage), res.data);
    }

    if (res.data.Data.RetCode !== 0) {
      throw new HttpsError(400, res.data.Data.RetMsg, res.data);
    }
    return res.data;
  }

  /**
   * 处理请求参数，并生成签名
   * @param {String} action 接口操作名
   * @param {Object} options
   * @param {Undefined|Object} options.userParams 金山云接口所需的参数，这里面可以不传 Action 和 Version
   * @param {String} [options.method] http method, 默认是 GET
   * @param {String} [options.path] 金山云接口请求地址, 默认是 /
   * @param {Undefined|Object} [options.headers] http headers
   * @return {Object}
   */
  _handleRequest(action, options = {}) {
    assert(!options.userParams || _.isPlainObject(options.userParams), 'options.userParams must be json type or undefined'); // eslint-disable-line max-len
    options = _.defaultsDeep(options, {
      method: 'GET',
      host: this.host,
      path: '/',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '',
      region: this.region,
      service: this.service,
    });

    const url = require('url').parse(this.endpoint + options.path);
    let query = qs.parse(url.query);
    query.Action = action;
    query.Version = this.Version;

    if (options.userParams) {
      if (options.method === 'GET') {
        query = _.assign(query, options.userParams);
      } else {
        options.body = JSON.stringify(options.userParams);
      }
    }

    options.path = url.pathname + '?' + qs.stringify(query);
    options = _.pick(options, ['method', 'host', 'path', 'headers', 'body', 'region', 'service']);
    options = aws4.sign(options, {
      secretAccessKey: this.secretAccessKey,
      accessKeyId: this.accessKeyId,
    });

    options.url = this.endpoint + options.path;
    options.content = options.body;
    options.dataType = 'json';

    return options;
  }

  /**
   * 通过 action 获取接口的 method 和 path
   * @param {String} action 操作接口名
   * @return {Object} {method: <String>, path: <String>}
   */
  _getApi(action) {
    switch (action) {
      case 'ListRealtimeStreamsInfo':
        return {method: 'POST', path: '/api/ListRealtimeStreamsInfo/2017-01-01'};
      case 'ListRealtimePubStreamsInfo':
      case 'ListHistoryPubStreamsInfo':
      case 'ListHistoryPubStreamsErrInfo':
      case 'GetBlacklist':
      case 'ListStreamDurations':
      case 'CheckBlacklist':
      case 'ListRecordingTasks':
      case 'ListHistoryRecordTasks':
      case 'GetRecordTask':
        return {};
      case 'ForbidStream':
        return {method: 'POST'};
      case 'ResumeStream':
        return {method: 'POST', path: '/api/ResumeStream/2017-01-01'};
      default:
        assert(false, 'invalid "action"');
    }
  }
}

module.exports = Client;

