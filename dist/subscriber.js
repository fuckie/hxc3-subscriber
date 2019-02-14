// @charset "utf-8";
/**
 * 发布与订阅
 * EventTarget.on('getTodayData', function(data){ ...  }); 
 * EventTarget.trigger('getTodayData', data);
 *
 * 支持一层 命名空间
 * EventTarget.on('getTodayData.abc', function(data){ ...  }); 
 * EventTarget.on('getTodayData.cdef', function(data){ ...  }); 
 * EventTarget.trigger('getTodayData', data);
 */

// cmd amd模块兼容
;(function (name, definition) {
    // 检测上下文环境是否为AMD或CMD
    var hasDefine = typeof define === 'function',
        // 检查上下文环境是否为Node
        hasExports = typeof module !== 'undefined' && module.exports;
    if (hasDefine) {
        // AMD环境或CMD环境
        define(definition);
    } else if (hasExports) {
        // 定义为普通Node模块
        module.exports = definition();
    } else {
        // 将模块的执行结果挂在window变量中，在浏览器中this指向window对象
        this[name] = definition();
    }
})('EventTarget', function () {

    var EventTarget = function(){
        // 最多回调函数个数
        this.maxCallbackNum = 50;
        // 达到最多回调函数 是否抛异常
        this.maxCallbackAlert = true;
        this.eventTopics = {};
        this.eventSubUid = 0;
    }

    // 利用好本函数的返回值 很重要，如果在一个定时器里面 不断被触发，而触发的topic在后来被释放了(解绑了)
    // 需要靠 trigger 的返回值来判断 是否还需要不断被触发
    // var runFlag = true, intervalNum;
    // intervalNum = setInterval(function () {
    //     if (!runFlag) {
    //         clearInterval(intervalNum);
    //         return;
    //     }
    //     runFlag = that.trigger('getData', 'shagua');
    // }, 1000);
    // 
    EventTarget.prototype.trigger = function ( topicTotal, args ) {
        // 不接受以. 开头的trigger事件名
        if(/^\./.test(topicTotal) || !this.hasTopic(topicTotal)){
            return false;
        }

        var topicObj = this._getTopicName(topicTotal);
        var topic = topicObj.topic;
        var namespace = topicObj.namespace;

        var that = this;
        setTimeout(function () {
            var subscribers = that.eventTopics[topic],
                len = subscribers ? subscribers.length : 0;

            while (len--) {
                // 如果 trigger('getdata', d)  不含命名空间的,
                // 那么监听getdata的所有回调(getdata.abc, getdata.bbb, ...) 都要被触发；
                // 如果 trigger('getdata.abc', d)  含命名空间的
                // 那么只需要触发监听了 getdata.abc 被触发
                if(!namespace || (subscribers[len].namespace == namespace)){
                    subscribers[len].func(args);
                }
            }
        }, 0);
        return true;
    };

    // 过滤 命名空间  click.abc
    EventTarget.prototype._getTopicName = function ( topicTotal ) {
        return {
            topic: topicTotal.split('.')[0], 
            namespace: topicTotal.split('.')[1]
        };
    }

    /**
     * 查找是否包含该事件
     */
    EventTarget.prototype.hasTopic = function (topicTotal) {
        var topicObj = this._getTopicName(topicTotal);
        var topic = topicObj.topic;
        var namespace = topicObj.namespace;
        
        // 查找 是否含有回调事件
        // 考虑命名空间
        if (!this.eventTopics[topic]) return false;
        if(namespace){
            var findFlag = false;
            var subscribers = this.eventTopics[topic],
                len = subscribers ? subscribers.length : 0;
            while (len--) {
                if(subscribers[len].namespace == namespace){
                    findFlag = true;
                }
            }
            return findFlag;
        }
        return true;
    }

    EventTarget.prototype.getTopicsByNamespace = function (namespace) {
        var topicsName = [];
        this.eachTopics(function(item, m){
            for (var i = 0; i < item.length; i++) {
                if (item[i].namespace === namespace) {
                    topicsName.push(m);
                }
            }
        });
        return topicsName;
    }

    EventTarget.prototype.eachTopics = function (cb, context) {
        var obj = this.eventTopics;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                cb.call(context, obj[key], key, obj);
            }
        }
    }

    // 获取 当前所有回调函数数量
    EventTarget.prototype.getTotalCallbackNum = function () {
        var num = 0;
        this.eachTopics(function(item, m){
            for (var i = 0; i < item.length; i++) {
                num++;
            }
        });

        if (this.maxCallbackAlert && num > this.maxCallbackNum) { 
            throw new Error('当前监听的回调函数达到上限'+this.maxCallbackNum+'个, 请检查代码,在绑定同名事件前先解绑之前的监听:释放资源');
        }
        return num;
    }

    // 先注册监听事件, 再触发
    // 监听同名事件, 先监听的回调函数会最后被触发
    EventTarget.prototype.on = function (topicTotal, func) {
        var topicObj = this._getTopicName(topicTotal);
        var topic = topicObj.topic;
        var namespace = topicObj.namespace;

        if (!this.eventTopics[topic]) {
            this.eventTopics[topic] = [];
        }
        var token = ++this.eventSubUid;
        
        this.eventTopics[topic].push({
            token: token,
            namespace: namespace,
            func: func
        });
        return token;
    };

    EventTarget.prototype._arrangeTopicAndPos = function (topic) {
        var topicArr = this.eventTopics[topic];
        if (!topicArr || topicArr.length < 1) {
            delete this.eventTopics[topic];
        }else{
            var store = [];
            for (var i = 0; i < topicArr.length; i++) {
                if(typeof topicArr[i] !== 'undefined'){
                   store.push(topicArr[i]);
                }
            }

            if (store.length < 1) {
                delete this.eventTopics[topic];
            }else{
                this.eventTopics[topic] = store;
            }

        }
    }

    EventTarget.prototype._clearEventByTopicAndPos = function (topic, pos) {
        this.eventTopics[topic].splice(pos, 1, undefined);
    }

    EventTarget.prototype._offByTopicName = function (topicTotal) {
        var topicObj, namespace;
        // namespace
        if (/^\./.test(topicTotal)) {
            var findFlag = false;
            topicObj = this._getTopicName(topicTotal);
            namespace = topicObj.namespace;

            var clearArr = [], topicTypeArr = [];

            this.eachTopics(function(item, m){
                var typeMark = false;
                for (var i = 0; i < item.length; i++) {
                    if (item[i].namespace === namespace) {
                        findFlag = true;
                        typeMark = true;
                        clearArr.push({topic:m, pos:i});
                    }
                }
                typeMark && topicTypeArr.push(m);
            })
                    
            for (var i = 0; i < clearArr.length; i++) {
                this._clearEventByTopicAndPos(clearArr[i].topic, clearArr[i].pos);
            }
            for (var i = 0; i < topicTypeArr.length; i++) {
                this._arrangeTopicAndPos(topicTypeArr[i]);
            }
            return findFlag;
        }else{
            if(!this.hasTopic(topicTotal)){
                return false;
            }
            
            topicObj = this._getTopicName(topicTotal);
            namespace = topicObj.namespace;
            var topic = topicObj.topic;
            for (var i = 0; i < this.eventTopics[topic].length; i++) {
                if (!namespace || this.eventTopics[topic][i].namespace === namespace) {
                    this._clearEventByTopicAndPos(topic, i);
                    // return topic;
                }
            }
            this._arrangeTopicAndPos(topic);
            return topic;

        }

    }

    /* 解除监听
     * Examples
     *
     *      // Example 1 - off with a token
     *      var token = EventTarget.on('mytopic', myFunc);
     *      PubSub.off(token);
     *
     *      // Example 2 - off with only namespace
     *      PubSub.off('.anamespace');
     *
     *      // Example 3 - off a topic
     *      PubSub.off('mytopic');
     * 
     *      // Example 4 - off a topic with namespace
     *      PubSub.off('mytopic.anamespace');
     */
    EventTarget.prototype.off = function ( value ) {
        if (!value && value != 0) { return false; }

        var isTopic = typeof value === 'string',
            isToken = !isTopic && (typeof value === 'string' || typeof value === 'number');

        if (isTopic){
            // 判断是否存在该事件名
            return this._offByTopicName(value);
        }
        if (isToken) {
            var markType = false;

            this.eachTopics(function(topicArr, m){
                for (var i = 0; i < topicArr.length; i++) {
                    if (topicArr[i].token === value) {
                        markType = m;
                        this._clearEventByTopicAndPos(m, i);
                    }
                }
            }, this) 
            markType && this._arrangeTopicAndPos(markType);
            return markType;
        }

        return false;
    }

    return EventTarget;
    
});
