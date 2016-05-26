import axios from 'axios'
import buildURL from 'axios/lib/helpers/buildURL'
import transformData from 'axios/lib/helpers/transformData'
import isURLSameOrigin from 'axios/lib/helpers/isURLSameOrigin'
import btoa from 'axios/lib/helpers/btoa'
import cookies from 'axios/lib/helpers/cookies'
import settle from 'axios/lib/helpers/settle'

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

class Moxios {
  constructor() {
    this.stubs = new Tracker()
    this.requests = new Tracker()
  }

  /**
   * Install the mock adapter for axios
   */
  install(instance = axios) {
    defaultAdapter = instance.defaults.adapter
    instance.defaults.adapter = mockAdapter
  }

  /**
  * Uninstall the mock adapter and reset state
  */
  uninstall(instance = axios) {
    instance.defaults.adapter = defaultAdapter
    this.stubs.reset()
    this.requests.reset()
  }

  /**
  * Stub a response to be used to respond to a request matching a URL or RegExp
  *
  * @param {String|RegExp} urlOrRegExp A URL or RegExp to test against
  * @param {Object} response The response to use when a match is made
  */
  stubRequest(urlOrRegExp, response) {
    this.stubs.track({url: urlOrRegExp, response})
  }

  /**
  * Run a single test with mock adapter installed.
  * This will install the mock adapter, execute the function provided,
  * then uninstall the mock adapter once complete.
  *
  * @param {Function} fn The function to be executed
  */
  withMock(fn) {
    this.install()
    try {
      fn()
    } finally {
      this.uninstall()
    }
  }

  /**
  * Wait for request to be made before proceding.
  * This is naively using a `setTimeout`.
  * May need to beef this up a bit in the future.
  *
  * @param {Function} fn The function to execute once waiting is over
  */
  wait(fn) {
    setTimeout(fn)
  }
}

class Tracker {
  constructor() {
    this.__items = []
  }

  reset() {
    this.__items.splice(0)
  }

  track(item) {
    this.__items.push(item)
  }
  
  count() {
    return this.__items.length
  }

  at(index) {
    return this.__items[index]
  }
  
  first() {
    return this.at(0)
  }

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
    let response = {
      data: transformData(
        res.responseText || res.response,
        res.headers,
        this.config.transformResponse
      ),
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      config: this.config,
      request: this
    }

    settle(this.resolve, this.reject, response)

    return new Promise(function (resolve) {
      moxios.wait(function () {
        resolve(response)
      })
    })
  }
}

let moxios = new Moxios()
export default moxios
