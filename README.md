# it-res
IT资源管理模块

## 概述
IT资源管理模块用于将校内所有IT资源，包括服务器、存储系统、网络设备等，集中进行登记和管理。在登记IT资源的同时，同时也登记针对该资源的监控程序，以便使用轮询方式对资源的状态进行监控。

## 安装

`npm install it-res`

## 用法

### 添加一个资源

```


var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('db conn string', function(err,db){
	var ItRes = require('it-res').Model(db, 'it_res_collection');
	var itres = {                                     // 构建itres对象
	    name: req.body.name,
	    domain: req.body.domain,
	    type: parseInt(req.body.type),
	    creator: req.user._id,
	    managers: [req.user._id]
	};
	ItRes.add(itres, function (err, doc) {            // 将itres对象存储到数据库中
	    if(err){
	        res.send({ret: -1, msg: err});
	        return;
	    }
	    res.send({ ret: 0, data: doc });
	});
});



```

其他用法可参考测试文件。