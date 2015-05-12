/**
 * Created by 文琪 on 2015/4/22.
 * it_resources 数据
 * {
        name: '名称'
 *      domain: '域名',
        managers: ['管理员Id'],
        type: 1,                    // 类型 1: 服务器，2：Web应用，3：其他应用
        monitors: [{                // 监控程序
            name: '名称',
            type: 1,                // 类型 1：Url监控，2：端口监控
            url: 'http://..',       // Url监控必须
            port: 22,               // 端口号，端口监控必须
            receivers: [1,2],       // 报警接收方式，1：微信企业号，2：短信，3：电子邮件
            dateCreated: Date()     // 创建时间
        }],
        dateCreated: Date()         // 创建时间 
 * }
 */


var ObjectID = require('mongodb').ObjectID,
    Db = require('mongodb').Db;

var EventProxy = require('eventproxy');


module.exports = function(db, collection) {
    collection = collection || 'it_resources';

    var connect = function (callback) {
        if(db instanceof Db){
            callback(null, db);
        } else {
            callback('db is not a instance of Db', null);
        }
    };

    var getCollection = function (callback) {
        connect(function (err, db) {                                    // 连接数据库
            if(err) callback(err, null);
            else {
                var col = db.collection(collection);                    // 获取集合实例
                callback(null, col);
            }
        });
    };

    /**
     * 通用find方法
    **/
    var find = function  (query, callback) {
        getCollection(function (err, col) {
            if(err) callback(err, null);
            else {
                col.find(query).toArray(function (err, result) {        // 查询，并返回数组
                    callback(err, result);                              // 通过callback返回
                });
            }
        });
    };

    return {

        /**
         * 添加IT资源信息到数据库中
        */
        add: function(itres, callback) {
            getCollection(function (err, col) {
                if(err) callback(err, null);
                else {
                    itres._id = new ObjectID();
                    itres.dateCreated = new Date();
                    col.insert(itres, function (err, result) {
                        callback(err, itres);
                    });
                }
            })
        },

        addMonitor: function (resId, monitor, callback) {
            getCollection(function (err, col) {
                if(err) callback(err, null);
                else {
                    monitor.dateCreated = new Date();
                    monitor.id = (new ObjectID()).toString();
                    col.update({'_id': resId}, {
                        '$push': {'monitors': monitor}, 
                        '$inc':{'monitor_count': 1}
                    }, function (err, result) {
                        callback(err, monitor);
                    });
                }
            });
        },

        /**
         * 获取所有IT资源
        **/
        listAll: function (callback) {
            find({}, callback);
        },

        /**
         * 根据管理员Id获取资源列表
        **/
        listByMngr: function (mngr, callback) {
            find({managers: mngr}, callback);
        },

        /*
         * 根据Id获取资源
        */
        getById: function (id, callback) {
            getCollection(function (err, col) {
                if(err) callback(err, null);
                else {
                    col.findOne({'_id': id}, function (err, result) {
                        callback(err, result);
                    });
                }
            });
        },

        /*
        * 根据域名获取资源信息
        */
        getByDomain: function (domain, callback) {
            getCollection(function (err, col) {
                if(err) callback(err, null);
                else {
                    col.findOne({'domain': domain}, function (err, result) {
                        callback(err, result);
                    });
                }
            });
        },

        remove: function (id, callback) {
            getCollection(function (err, col) {
                if(err) callback(err, null);
                else {
                    col.remove({'_id': id}, function (err, result) {
                        callback(err, result);
                    });
                }
            });
        },
        removeMonitor: function (resId, monitorId, callback) {
            getCollection(function (err, col) {
                if(err) callback(err, null);
                else {
                    col.findOne({'_id': resId}, function (err, itres) {
                        if(err || !itres || !itres.monitors){
                            callback(err || '找不到资源或资源不包含任何监视程序');
                            return;
                        }
                        for (var i = 0; i < itres.monitors.length; i++) {
                            if(itres.monitors[i].id === monitorId){
                                itres.monitors.splice(i, 1);
                                col.update({'_id': resId}, {
                                    '$set': { monitors: itres.monitors },
                                    '$inc': { monitor_count: -1}
                                }, function (err, result) {
                                    callback(err, result);
                                });
                                break;
                            }
                            else if((i + 1) === itres.monitors.length){
                                callback('资源不包含指定Id的监视程序');
                            }
                        };
                    });
                }
            });
        },
        stat: function (callback) {
            getCollection(function (err, col) {
                if(err) callback(err, null);
                else {
                    var ep = new EventProxy();
                    ep.all('res_count', 'monitor_count', 'mngr_count', function (res_result, monitor_result, mngr_result) {
                        var err = res_result.err || monitor_result.err || mngr_result.err;
                        callback(err, {
                            res_count: res_result.count,
                            monitor_count: monitor_result.count,
                            mngr_count: mngr_result.count
                        });
                    });

                    col.count(function (err, count) {
                        ep.emit('res_count', {err: err, count: count});
                    });

                    col.aggregate([{
                        '$group': { _id: 1, count: {'$sum': '$monitor_count'}}
                    }], function (err, result) {
                        if(result.length === 0){
                            result.push({count: 0});
                            err = '没找到任何统计数据';
                        }
                        result[0].err = err;
                        ep.emit('monitor_count', result[0]);
                    });

                    col.distinct('creator', function (err, docs) {
                        ep.emit('mngr_count', {err: err, count: docs.length});
                    });
                }
            });
        },
        statByCreator: function (creator, callback) {
            getCollection(function (err, col) {
                if(err) callback(err, null);
                else {
                    var ep = new EventProxy();
                    ep.all('res_count', 'monitor_count', function (res_result, monitor_result) {
                        var err = res_result.err || monitor_result.err
                        callback(err, {
                            res_count: res_result.count,
                            monitor_count: monitor_result.count
                        });
                    });

                    col.count({creator: creator}, function (err, count) {
                        ep.emit('res_count', {err: err, count: count});
                    });

                    col.aggregate([
                        {
                            '$match': {creator: creator}
                        },
                        {
                            '$group': { _id: 1, count: {'$sum': '$monitor_count'}}
                        }
                    ], function (err, result) {
                        if(result.length === 0){
                            result.push({count: 0});
                            err = '没找到指定的创建者';
                        }
                        result[0].err = err;
                        ep.emit('monitor_count', result[0]);
                    });
                }
            });
        }
    };
};