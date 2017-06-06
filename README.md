# hxc3-subscriber

订阅与发布


[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![gemnasium deps][gemnasium-image]][gemnasium-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]


[npm-image]: http://img.shields.io/npm/v/hxc3-subscriber.svg?style=flat-square
[npm-url]: http://npmjs.org/package/hxc3-subscriber
[travis-image]: https://img.shields.io/travis/react-component/menu.svg?style=flat-square
[travis-url]: https://travis-ci.org/react-component/menu
[coveralls-image]: https://img.shields.io/coveralls/react-component/menu.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/react-component/menu?branch=master
[gemnasium-image]: http://img.shields.io/gemnasium/react-component/menu.svg?style=flat-square
[gemnasium-url]: https://gemnasium.com/react-component/menu
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/hxc3-subscriber.svg?style=flat-square
[download-url]: https://npmjs.org/package/hxc3-subscriber



## Install

[![hxc3-subscriber](https://nodei.co/npm/hxc3-subscriber.png)](https://npmjs.org/package/hxc3-subscriber)

## Usage

### subscribe and publish

```js
// 可以直接引用 dist/subscriber.js 获得 EventTarge
// or 使用 import EventTarge from "hxc3-subscriber";

var a = new EventTarge();


// 发布与订阅
// subscribe
a.on('getTodayData', function(data){ ...  });

// publish
a.trigger('getTodayData', 'hello world');
```

### support one level namespace(支持一层命名空间)

```js
// 支持一层 命名空间
a.on('getTodayData.abc', function(data){ ...  }); 
a.on('getTodayData.cdef', function(data){ ...  }); 

a.trigger('getTodayData', data);

// 不支持多层命名空间 not support 
a.on('getTodayData.cdef.child', function(data){ ...  }); 
```

### 解绑方式

```js
// Example 1 - off with a token
var token = EventTarget.on('mytopic', myFunc);
PubSub.off(token);

// Example 2 - off with only namespace
PubSub.off('.anamespace');

// Example 3 - off a topic
PubSub.off('mytopic');

// Example 4 - off a topic with namespace
PubSub.off('mytopic.anamespace');
```
