import axios from 'axios'
import buildURL from 'axios/lib/helpers/buildURL'
import transformData from 'axios/lib/helpers/transformData'
import isURLSameOrigin from 'axios/lib/helpers/isURLSameOrigin'
import btoa from 'axios/lib/helpers/btoa'
import cookies from 'axios/lib/helpers/cookies'
import settle from 'axios/lib/helpers/settle'

const DEFAULT_WAIT_DELAY = 100

// The default adapter
let defaultAdapter

/**
 * The mock adapter that gets installed.
 *
 * @param {Function} resolve The function to call when Promise is resolved
 * @param {Function} reject The function to call when Promise is rejected
 * @param {Object} config The config object to be used for the request
 */
let mockAdapter = (resolve, reject, config) => {
  let request = new Request(resolve, reject, config)
  moxios.requests.track(request)

  // Check for matching stub to auto respond with
  for (let i=0, l=moxios.stubs.count(); i<l; i++) {
    let stub = moxios.stubs.at(i)
    if (stub.url === request.url ||
        stub.url instanceof RegExp && stub.url.test(request.url)) {
      request.respondWith(stub.response)
      break
    }
  }
}

class Tracker {
  constructor() {
    this.__items = []
  }

  /**
   * Reset all the items being tracked
   */
  reset() {
    this.__items.splice(0)
  }

  /**
   * Add an item to be tracked
   *
   * @param {Object} item An item to be tracked
   */
  track(item) {
    this.__items.push(item)
  }
  
  /**
   * The count of items being tracked
   *
   * @return {Number}
   */
  count() {
    return this.__items.length
  }

  /**
   * Get an item being tracked at a given index
   *
   * @param {Number} index The index for the item to retrieve
   * @return {Object}
   */
  at(index) {
    return this.__items[index]
  }
  
  /**
   * Get the first item being tracked
   *
   * @return {Object}
   */
  first() {
    return this.at(0)
  }

  /**
   * Get the most recent (last) item being tracked
   *
   * @return {Object}
   */
  mostRecent() {
    return this.at(this.count() - 1)
  }
}

class Request {
  /**
   * Create a new Request object
   *
   * @param {Function} resolve The function to call when Promise is resolved
   * @param {Function} reject The function to call when Promise is rejected
   * @param {Object} config The config object to be used for the request
   */
  constructor(resolve, reject, config) {
    this.resolve = resolve
    this.reject = reject
    this.config = config

    this.headers = config.headers
    this.url = buildURL(config.url, config.params, config.paramsSerializer)
    this.timeout = config.timeout
    this.withCredentials = config.withCredentials || false
    this.responseType = config.responseType

    // Set auth header
    if (config.auth) {
      let username = config.auth.username || ''
      let password = config.auth.password || ''
      this.headers.Authorization = 'Basic ' + btoa(username + ':' + password)
    }

    // Set xsrf header
    if (typeof document !== 'undefined' && typeof document.cookie !== 'undefined') {
      let xsrfValue = config.withCredentials || isURLSameOrigin(config.url) ?
        cookies.read(config.xsrfCookieName) :
        undefined

      if (xsrfValue) {
        this.headers[config.xsrfHeaderName] = xsrfValue
      }
    }
  }

  /**
   * Respond to this request with a specified result
   *
   * @param {Object} res The data representing the result of the request
   * @return {Promise} A Promise that resolves once the response is ready
   */
  respondWith(res) {
    let response = new Response(this, res)
    settle(this.resolve, this.reject, response)
    return new Promise(function (resolve) {
      moxios.wait(function () {
        resolve(response)
      })
    })
  }
}

class Response {
  /**
   * Create a new Response object
   *
   * @param {Request} req The Request that this Response is associated with
   * @param {Object} res The data representing the result of the request
   */
  constructor(req, res) {
    this.config = req.config
    this.data = transformData(
      res.responseText || res.response,
      res.headers,
      this.config.transformResponse
    )
    this.status = res.status
    this.statusText = res.statusText
    this.headers = res.headers
    this.request = req
  }
}

let moxios = {
  stubs: new Tracker(),
  requests: new Tracker(),
  delay: DEFAULT_WAIT_DELAY,

  /**
   * Install the mock adapter for axios
   */
  install: function(instance = axios) {
    defaultAdapter = instance.defaults.adapter
    instance.defaults.adapter = mockAdapter
  },

  /**
  * Uninstall the mock adapter and reset state
  */
  uninstall: function(instance = axios) {
    instance.defaults.adapter = defaultAdapter
    this.stubs.reset()
    this.requests.reset()
  },

  /**
  * Stub a response to be used to respond to a request matching a URL or RegExp
  *
  * @param {String|RegExp} urlOrRegExp A URL or RegExp to test against
  * @param {Object} response The response to use when a match is made
  */
  stubRequest: function(urlOrRegExp, response) {
    this.stubs.track({url: urlOrRegExp, response})
  },

  /**
  * Run a single test with mock adapter installed.
  * This will install the mock adapter, execute the function provided,
  * then uninstall the mock adapter once complete.
  *
  * @param {Function} fn The function to be executed
  */
  withMock: function(fn) {
    this.install()
    try {
      fn()
    } finally {
      this.uninstall()
    }
  },

  /**
  * Wait for request to be made before proceding.
  * This is naively using a `setTimeout`.
  * May need to beef this up a bit in the future.
  *
  * @param {Function} fn The function to execute once waiting is over
  * @param {Number} delay How much time in milliseconds to wait
  */
  wait: function(fn, delay = this.delay) {
    setTimeout(fn, delay)
  }
}


export default moxios
