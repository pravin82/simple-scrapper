# Request - Simplified HTTP client

Fork of [request](https://github.com/request/request)  

Includes the following:  

* Adds Brotli support
* Bundles [request-promise-native](https://github.com/request/request-promise-native) and uses Promises by default
* Bundles updated typescript definitions that use Promises
* Updates/removes some packages that have security vulnerabilities

## Installing

```bash
npm install --save @ayakashi/request
```

## Using Brotli

Just pass `gzipOrBrotli: true` in the options instead of just `gzip: true`

```js
const request = require("@ayakashi/request");

const body = await request.get('https://www.google.com', {
    gzipOrBrotli: true
});
```

## Using the callback-based interface

Require `@ayakashi/request/core` instead of `@ayakashi/request`.  
Brotli is available here as well.

```js
const request = require("@ayakashi/request/core");

request.get('https://www.google.com', {gzipOrBrotli: true}, function(err, resp, body) {
    console.log(body);
});
```
