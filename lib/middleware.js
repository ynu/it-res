var ItRes = require('./model');
var ObjectID = require('mongodb').ObjectID;



module.exports = function() {
	return {
		/*
		 准备resId的值
		    - 首先考虑参数名为resId的值；
		    - 其次考虑post来的名为resId的值
		*/
		populateResId: function (req, res, next) {
		    if(req.params.resId) req.resId = new ObjectID(req.params.resId);
		    else if(req.body.resId) req.resId = new ObjectID(req.body.resId);
		    next();
		},

		/*
		 根据用户提供的req.resId获取IT资源。
		    - 如果执行出错，直接返回错误信息JSON
		    - 如果执行成功，将资源数据放置于 req.itres 中。
		*/
		getResById: function (req, res, next) {
		    if(!req.resId){
		        next();
		        return;
		    }
		    ItRes.getById(req.resId, function (err, itres) {
		        if(err){
		             res.send({ret: -1, msg: err});
		             return;
		        }
		        req.itres = itres;
		        next();
		    });
		 }
	};
};