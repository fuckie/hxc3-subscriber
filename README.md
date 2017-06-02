## install
    
[![hxc3-subscriber](https://nodei.co/npm/hxc3-subscriber.png)](https://npmjs.org/package/hxc3-subscriber)
    

## subscribe and publish

    var a = new EventTarge();

    // 发布与订阅
    // subscribe
    a.on('getTodayData', function(data){ ...  });

    // publish
    a.trigger('getTodayData', 'hello world');

## support one level namespace(支持一层命名空间)

    // 支持一层 命名空间
    a.on('getTodayData.abc', function(data){ ...  }); 
    a.on('getTodayData.cdef', function(data){ ...  }); 

    a.trigger('getTodayData', data);
    
    // 不支持多层命名空间 not suporrt 
    a.on('getTodayData.cdef.child', function(data){ ...  }); 


## 解绑方式

    // Example 1 - off with a token
    var token = EventTarget.on('mytopic', myFunc);
    PubSub.off(token);

    // Example 2 - off with only namespace
    PubSub.off('.anamespace');

    // Example 3 - off a topic
    PubSub.off('mytopic');

    // Example 4 - off a topic with namespace
    PubSub.off('mytopic.anamespace');
