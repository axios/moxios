import axios from 'axios'

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
  }

  /**
   * Respond to this request with a timeout result
   *
   * @return {Promise} A Promise that rejects with a timeout result
   */
  respondWithTimeout() {
    return new Promise(function(resolve, reject) {
      resolve();
    })
  }
}



export default Request
