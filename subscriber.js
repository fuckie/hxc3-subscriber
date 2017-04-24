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
define(function(){
    var EventTarget = function(){
        // 最多回调函数个数
        this.maxCallbackNum = 20;
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
    EventTarget.prototype.trigger = function ( topic, args ) {
        // 不接受以. 开头的trigger事件名
        if(/^\./.test(topic) || !this._hasTopic(topic)){
            return false;
        };

        var topicObj = this._getTopic(topic);
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
                if((namespace == '' ) || (subscribers[len].namespace == namespace)){
                    subscribers[len].func(args);
                }
            }
        }, 0);
        return true;
    };
    
    // 过滤 命名空间  click.abc
    EventTarget.prototype._getTopic = function ( topic ) {
        var namespaceHierarchy = [];
        var namespace = '';
        if (/\./.test(topic)) {
            namespaceHierarchy = topic.split(".");
        }
        // 只支持一层
        if (namespaceHierarchy.length === 2) {
            topic = namespaceHierarchy[0];
            namespace = namespaceHierarchy[1];
        };

        return {topic:topic, namespace: namespace};
    }

    /**
     * 查找是否包含该事件
     */
    EventTarget.prototype._hasTopic = function (topic) {
        var topicObj = this._getTopic(topic);
        var topic = topicObj.topic;
        var namespace = topicObj.namespace;
        var findFlag = false;
        
        // 查找 是否含有回调事件
        // 考虑命名空间
        if (!this.eventTopics[topic]) {
            return false;
        }else if(namespace){
            var subscribers = this.eventTopics[topic],
                len = subscribers ? subscribers.length : 0;
            while (len--) {
                if((subscribers[len].namespace == namespace)){
                    findFlag = true;
                }
            }
            if(!findFlag) return false;
        }
        return true;
    }
    // 获取 当前所有回调函数数量
    EventTarget.prototype.getTotalCallbackNum = function () {
        var num = 0;
        for (var m in this.eventTopics) {
            if (this.eventTopics[m]) {
                for (var i = 0, j = this.eventTopics[m].length; i < j; i++) {
                    num++;
                }
            }
        }
        if (this.maxCallbackAlert && num > this.maxCallbackNum) { 
            throw new Error('当前监听的回调函数达到上限'+this.maxCallbackNum+'个, 请检查代码,在绑定同名事件前先解绑之前的监听:释放资源, 防止内存泄漏; 或者您可以关闭此异常提示 this.maxCallbackAlert = false;');
        }
        return num;
    }

    // 先注册监听事件, 再触发
    // 监听同名事件, 先监听的回调函数会最后被触发
    EventTarget.prototype.on = function ( topic, func ) {

        var topicObj = this._getTopic(topic);
        var topic = topicObj.topic;
        var namespace = topicObj.namespace;

        if (!this.eventTopics[topic]) {
            this.eventTopics[topic] = [];
        }
        var token = (++this.eventSubUid);
        
        this.eventTopics[topic].push({
            token: token,
            namespace: namespace,
            func: func
        });
        return token;
    };

    EventTarget.prototype._clearEventByTopicAndPos = function (topic, pos) {
        // 一般的， 拿到token删除指定的回调
        // 但如果该token的 namespace 是空， 会删除该事件名所有监听；
        if (this.eventTopics[topic][pos].namespace === '') {
            delete this.eventTopics[topic];
        }else{
            this.eventTopics[topic].splice(pos, 1);
        }
        if (this.eventTopics[topic].length < 1) {
            delete this.eventTopics[topic];
        }

    }

    EventTarget.prototype._offByTopicName = function (topic) {
        if (/^\./.test(topic)) {
            var findFlag = false;
            var topicObj = this._getTopic(topic);
            var namespace = topicObj.namespace;
            var clearArr = [];

            for (var m in this.eventTopics) {
                if (this.eventTopics[m]) {
                    for (var i = 0, j = this.eventTopics[m].length; i < j; i++) {
                        if (this.eventTopics[m][i].namespace === namespace) {
                            findFlag = true;
                            clearArr.push({topic:m, pos:i});
                        }
                    }
                }
            }
            for (var i = 0; i < clearArr.length; i++) {
                this._clearEventByTopicAndPos(clearArr[i].topic, clearArr[i].pos);
            }
            return findFlag;
        }else{
            if(!this._hasTopic(topic)){
                return false;
            };

            var topicObj = this._getTopic(topic);
            var topic = topicObj.topic;
            var namespace = topicObj.namespace;
            for (var i = 0, j = this.eventTopics[topic].length; i < j; i++) {
                if (this.eventTopics[topic][i].namespace === namespace) {

                    this._clearEventByTopicAndPos(topic, i);
                    return topic;
                }
            }
            return false;

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
        if (!value && value != 0) { return false; };

        var isTopic    = typeof value === 'string',
            isToken    = !isTopic && (typeof value === 'string' || typeof value === 'number' );

        if (isTopic){
            // 判断是否存在该事件名
            return this._offByTopicName(value);
        }
        if (isToken) {
            for (var m in this.eventTopics) {
                if (this.eventTopics[m]) {
                    for (var i = 0, j = this.eventTopics[m].length; i < j; i++) {
                        if (this.eventTopics[m][i].token === value) {

                            this._clearEventByTopicAndPos(m, i);
                            return value;
                        }
                    }
                }
            }
        }

        return false;
    }

    return EventTarget;
    
});