import { equal, notEqual, deepEqual } from 'assert'
import axios from 'axios'
import moxios from './index'

const USER_FRED = {
  id: 12345,
  firstName: 'Fred',
  lastName: 'Flintstone'
}

describe('moxios', function () {
  it('should install', function () {
    let defaultAdapter = axios.defaults.adapter
    moxios.install()
    notEqual(axios.defaults.adapter, defaultAdapter)
    moxios.uninstall()
  })

  it('should uninstall', function () {
    let defaultAdapter = axios.defaults.adapter
    moxios.install()
    moxios.uninstall()
    equal(axios.defaults.adapter, defaultAdapter)
  })

  describe('requests', function () {
    let onFulfilled
    let onRejected

    beforeEach(function () {
      moxios.install()
      onFulfilled = sinon.spy()
      onRejected = sinon.spy()
    })

    afterEach(function () {
      moxios.uninstall()
    })

    it('should intercept requests', function (done) {
      axios.get('/users/12345')

      moxios.wait(function () {
        let request = moxios.requests.mostRecent()
        equal(moxios.requests.count(), 1)
        done()
      })
    })

    it('should mock responses', function (done) {
      axios.get('/users/12345').then(onFulfilled)

      moxios.wait(function () {
        let request = moxios.requests.mostRecent()
        request.respondWith({
          status: 200,
          response: USER_FRED
        }).then(function () {
          let response = onFulfilled.getCall(0).args[0]
          equal(onFulfilled.called, true)
          equal(response.status, 200)
          deepEqual(response.data, USER_FRED)
          done()
        })
      })
    })

    it('should mock responses Error', function (done) {
      axios.get('/users/12346').then(onFulfilled, onRejected)

      moxios.wait(function () {
        let request = moxios.requests.mostRecent()
        request.respondWith({
          status: 404
        }).then(function () {
          equal(onFulfilled.called, false)
          equal(onRejected.called, true)
          done()
        })
      })
    })

    it('should mock one time', function (done) {
      moxios.uninstall()

      moxios.withMock(function () {
        axios.get('/users/12345').then(onFulfilled)

        moxios.wait(function () {
          let request = moxios.requests.mostRecent()
          request.respondWith({
            status: 200,
            response: USER_FRED
          }).then(function () {
            equal(onFulfilled.called, true)
            done()
          })
        })
      })
    })

    it('should stub requests', function (done) {
      moxios.stubRequest('/users/12345', {
        status: 200,
        response: USER_FRED
      })

      axios.get('/users/12345').then(onFulfilled)

      moxios.wait(function () {
        let response = onFulfilled.getCall(0).args[0]
        deepEqual(response.data, USER_FRED)
        done()
      })
    })

    it('should stub requests RegExp', function (done) {
      moxios.stubRequest(/\/users\/\d*/, {
        status: 200,
        response: USER_FRED
      })

      axios.get('/users/12345').then(onFulfilled)

      moxios.wait(function () {
        let response = onFulfilled.getCall(0).args[0]
        deepEqual(response.data, USER_FRED)
        done()
      })
    })

    describe('wait', function(){
      let timeSpy

      beforeEach(function(){
        timeSpy = sinon.spy(global, 'setTimeout');
      })

      afterEach(function(){
        global.setTimeout.restore();
      })

      it('should return promise if wait cb is omitted', function (done) {
        moxios.wait().then(() => {
          equal(timeSpy.calledWith(sinon.match.any, moxios.delay), true);
          done();
        })
      })

      it('should return resolved promise after specified delay if no cb', function (done) {
        moxios.wait(33).then(() => {
          equal(timeSpy.calledWith(sinon.match.any, 33), true);
          done();
        })
      })
    })
  })
})
