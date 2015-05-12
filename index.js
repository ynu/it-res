var model = require('lib/model');
var middleware = require('lib/middleware');

module.exports = function () {
    return {
        Model: model,
        Middleware: middleware
    };
};