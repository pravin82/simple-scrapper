'use strict'

var request = require('../index')
var http = require('http')
var {compress} = require("iltorb");
var assert = require('assert')
var tape = require('tape')

var testContent = 'Compressible response content.\n'
var testContentBig
var testContentBigGzip
var testContentGzip

var server = http.createServer(function (req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')

  if (req.method === 'HEAD') {
    res.setHeader('Content-Encoding', 'br')
    res.end()
    return
  }
  if (req.headers.code) {
    res.writeHead(req.headers.code, {
      'Content-Encoding': 'br',
      code: req.headers.code
    })
    res.end()
    return
  }

  if (/\bbr\b/i.test(req.headers['accept-encoding'])) {
    res.setHeader('Content-Encoding', 'br')
    if (req.url === '/error') {
      // send plaintext instead of gzip (should cause an error for the client)
      res.end(testContent)
    } else {
        compress(Buffer.from(testContent), function (err, data) {
        assert.equal(err, null)
        res.end(data)
      })
    }
  } else {
    res.end(testContent)
  }
})

tape('setup', function (t) {
  // Need big compressed content to be large enough to chunk into gzip blocks.
  // Want it to be deterministic to ensure test is reliable.
  // Generate pseudo-random printable ASCII characters using MINSTD
  var a = 48271
  var m = 0x7FFFFFFF
  var x = 1
  testContentBig = Buffer.alloc(10240)
  for (var i = 0; i < testContentBig.length; ++i) {
    x = (a * x) & m
    // Printable ASCII range from 32-126, inclusive
    testContentBig[i] = (x % 95) + 32
  }

  compress(Buffer.from(testContent), function (err, data) {
    t.equal(err, null)
    testContentGzip = data

    compress(Buffer.from(testContentBig), function (err, data2) {
      t.equal(err, null)
      testContentBigGzip = data2

      server.listen(0, function () {
        server.url = 'http://localhost:' + this.address().port
        t.end()
      })
    })
  })
})

tape('does not request gzip if user specifies Accepted-Encodings', function (t) {
  var headers = { 'Accept-Encoding': null }
  var options = {
    url: server.url + '/foo',
    headers: headers,
    gzipOrBrotli: true
  }
  request.get(options, function (err, res, body) {
    t.equal(err, null)
    t.equal(res.headers['content-encoding'], undefined)
    t.equal(body, testContent)
    t.end()
  })
})

tape('does not decode user-requested encoding by default', function (t) {
  var headers = { 'Accept-Encoding': 'br' }
  var options = { url: server.url + '/foo', headers: headers }
  request.get(options, function (err, res, body) {
    t.equal(err, null)
    t.equal(res.headers['content-encoding'], 'br')
    t.equal(body, testContentGzip.toString())
    t.end()
  })
})

tape('do not try to pipe HEAD request responses', function (t) {
  var options = { method: 'HEAD', url: server.url + '/foo', gzipOrBrotli: true }

  request(options, function (err, res, body) {
    t.equal(err, null)
    t.equal(body, '')
    t.end()
  })
})

tape('do not try to pipe responses with no body', function (t) {
  var options = { url: server.url + '/foo', gzipOrBrotli: true }

  // skip 105 on Node >= v10
  var statusCodes = process.version.split('.')[0].slice(1) >= 10
    ? [204, 304] : [105, 204, 304]

  ;(function next (index) {
    if (index === statusCodes.length) {
      t.end()
      return
    }
    options.headers = {code: statusCodes[index]}
    request.post(options, function (err, res, body) {
      t.equal(err, null)
      t.equal(res.headers.code, statusCodes[index].toString())
      t.equal(body, '')
      next(++index)
    })
  })(0)
})

tape('cleanup', function (t) {
  server.close(function () {
    t.end()
  })
})
