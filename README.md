# moxios [![build status](https://img.shields.io/travis/mzabriskie/moxios.svg?style=flat-square)](https://travis-ci.org/mzabriskie/moxios)

Mock [axios](https://github.com/mzabriskie/axios) requests for testing

## Installing

```bash
$ npm install moxios --save-dev
```

## Example

```js
import axios from 'axios'
import moxios from 'moxios'
import sinon from 'sinon'
import { equal } from 'assert'

describe('mocking axios requests', function () {

  describe('across entire suite', function () {

    beforeEach(function () {
      // import and pass your custom axios instance to this method
      moxios.install()
    })

    afterEach(function () {
      // import and pass your custom axios instance to this method
      moxios.uninstall()
    })

    it('specify response for a specific request', function (done) {
      let input = document.querySelector('.UserList__Filter__Input')
      let button = document.querySelector('.UserList__Filter__Button')

      input.value = 'flintstone'
      button.click()

      // Elsewhere in your code axios.get('/users/search', { params: { q: 'flintstone' } }) is called

      moxios.wait(function () {
        let request = moxios.requests.mostRecent()
        request.respondWith({
          status: 200,
          response: [
            { id: 1, firstName: 'Fred', lastName: 'Flintstone' },
            { id: 2, firstName: 'Wilma', lastName: 'Flintstone' }
          ]
        }).then(function () {
          let list = document.querySelector('.UserList__Data')
          equal(list.rows.length, 2)
          equal(list.rows[0].cells[0].innerHTML, 'Fred')
          equal(list.rows[1].cells[0].innerHTML, 'Wilma')
          done()
        })
      })
    })

    it('stub response for any matching request URL', function (done) {
      // Match against an exact URL value
      moxios.stubRequest('/say/hello', {
        status: 200,
        responseText: 'hello'
      })

      // Alternatively URL can be a RegExp
      moxios.stubRequest(/say.*/, {/* ... */})

      let onFulfilled = sinon.spy()
      axios.get('/say/hello').then(onFulfilled)

      moxios.wait(function () {
        equal(onFulfilled.getCall(0).args[0].data, 'hello')
        done()
      })
    })

  })

  it('just for a single spec', function (done) {
    moxios.withMock(function () {
      let onFulfilled = sinon.spy()
      axios.get('/users/12345').then(onFulfilled)

      moxios.wait(function () {
        let request = moxios.requests.mostRecent()
        request.respondWith({
          status: 200,
          response: {
            id: 12345, firstName: 'Fred', lastName: 'Flintstone'
          }
        }).then(function () {
          equal(onFulfilled.called, true)
          done()
        })
      })
    })
  })

})
```

## Thanks

moxios is heavily inspired by [jasmine-ajax](https://github.com/jasmine/jasmine-ajax)

## License

MIT
