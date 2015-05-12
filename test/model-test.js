var should = require("should");
var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID;



// 设置环境变量，读取config
process.env.NODE_ENV = 'development';

var mongoClientConfig = {
    server: {
        poolSize: 5,
        socketOptions: { autoReconnect: true }
    }
};

// 初始化需要测试的model

var ItRes = {};

describe("it-resource model test", function() {
	before(function (done) {
        MongoClient.connect('mongodb://127.0.0.1/ynu', mongoClientConfig, function (err, db) {
            ItRes = require('../lib/model')(db, 'it_res_test');
            done();
        });
	});

	var startCount = 0;
	it('listAll.获取当前所有数据', function (done) {
    	ItRes.listAll(function (err, itreses) {
    		should.not.exist(err);
    		(-1).should.below(itreses.length);
    		startCount = itreses.length;
    		done();
    	});
    });

	var id;
    it("add.能正确添加数据", function(done) {
        ItRes.add({
        	name: 'it res 1',
        	type: 1,
        	domain: 'test.ynu.edu.cn',
            creator: 'na57',
        	managers: ['na57', 'joe']
        }, function (err, result) {
        	should.not.exists(err);
        	should.exists(result._id);
        	id = result._id;
        	done();
        });
    });

    it('listAll.能列出所有数据', function (done) {
    	ItRes.listAll(function (err, itreses) {
    		should.not.exist(err);
    		itreses.should.be.lengthOf(startCount + 1);
    		done();
    	});
    });

    it('listByMngr.根据管理员找出ItRes', function (done) {
    	ItRes.listByMngr('joe', function (err, itreses) {
    		should.not.exist(err);
    		itreses.should.be.lengthOf(1);
    		itreses[0].managers.should.containEql('na57');
    		done();
    	});
    });

    it('addMonitor.添加Monitor', function (done) {
    	ItRes.addMonitor(id, {
    		name: 'monitor 1',
    		type: 1,
    		url: 'http://test.ynu.edu.cn',
    		receivers: [1,2,3]
    	}, function (err, monitor) {
    		should.not.exist(err);
            should.exist(monitor.id);
            ItRes.getById(id, function (err, itres) {
                (itres.monitor_count).should.eql(1);
                done();
            })
    	});
    });

    var monitorId;
    it('addMonitor.再次添加Monitor', function (done) {
        ItRes.addMonitor(id, {
            name: 'monitor 2',
            type: 1,
            url: 'http://2test.ynu.edu.cn',
            receivers: [1,2,3]
        }, function (err, monitor) {
            should.not.exist(err);
            should.exist(monitor.id);
            monitorId = monitor.id;
            ItRes.getById(id, function (err, itres) {
                (itres.monitor_count).should.eql(2);
                done();
            })
        });
    });

    it('stat.统计数据', function (done) {
        ItRes.stat(function (err, result) {
            should.not.exist(err);
            result.res_count.should.above(0);
            result.monitor_count.should.above(1);
            done();
        });
    });

    it('statByCreator.按创建者统计数据', function (done) {
        ItRes.statByCreator('na57', function (err, result) {
            should.not.exist(err);
            result.res_count.should.above(0);
            result.monitor_count.should.above(1);
            done();
        });
    });

    it('removeMonitor.删除Monitor', function (done) {
        ItRes.removeMonitor(id, monitorId, function (err, result) {
            should.not.exist(err);
            ItRes.getById(id, function (err, itres) {
                (itres.monitor_count).should.eql(1);
                itres.monitors[0].name.should.not.eql('monitor 2');
                done();
            })
        })
    });

    it('getById.根据Id找出ItRes', function (done) {
    	ItRes.getById(id, function (err, itres) {
    		should.not.exist(err);
    		itres.name.should.be.eql('it res 1');
            (itres.monitors.length).should.eql(1);
            (itres.monitor_count).should.eql(1);
    		done();
    	});
    });

    it('getByDomian.根据域名找出ItRes', function (done) {
    	ItRes.getByDomain('test.ynu.edu.cn', function (err, itres) {
    		should.not.exist(err);
    		itres.name.should.be.eql('it res 1');
    		done();
    	});
    });

    it('remove.根据Id删除ItRes', function (done) {
    	ItRes.remove(id, function (err, result) {
    		should.not.exist(err);
    		done();
    	});
    });

    it('删除之后无法再找到ItRes', function (done) {
    	ItRes.getById(id, function (err, itres) {
    		should.not.exist(err);
    		should.not.exist(itres);
    		done();
    	});
    });

    it('listAll.测试结束后，数据数量与之前相等', function (done) {
    	ItRes.listAll(function (err, itreses) {
    		should.not.exist(err);
    		itreses.should.be.lengthOf(startCount);
    		done();
    	});
    });
});