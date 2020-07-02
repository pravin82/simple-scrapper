'use strict'

var request = require('../index')
var http = require('http')
var server = require('./server')
var tape = require('tape')

var s = server.createServer()

s.on('/', function (req, resp) {
  resp.statusCode = 200
  resp.end('')
})

tape('setup', function (t) {
  s.listen(0, function () {
    t.end()
  })
})

tape('cleanup', function (t) {
  s.close(function () {
    t.end()
  })
})
