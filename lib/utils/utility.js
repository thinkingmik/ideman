var _ = require('lodash');

/**
 * Format error message
 * @param {Array(string|Object)} args
 * @return {Object}
 */
var formatError = function (args) {
    var msg = '';
    var err = '';
    var sts = '';
    var dta = null;

    if (!_.isNull(args[0]) && !_.isUndefined(args[0])) {
        for (var i = 0; i < args.length; i++) {
            if (_.isError(args[i])) {                
                err = args[i];
            }
            else if (_.isString(args[i])) {
                msg = args[i];
            }
            else if (_.isInteger(args[i])) {
                sts = args[i];
            }
            else if (_.isObject(args[i])) {
                dta = args[i];
            }
        }
    }

    var template = { errcode: sts, op: '', message: msg, data: dta };

    if (_.isError(err)) {
        template.op = err.title;
        if (_.isEmpty(msg)) {
            template.message = err.message;
        }
        if (_.isEmpty(sts)) {
            template.errcode = err.errcode;
        }
        if (!_.isNull(dta)) {
            template.data = err.data;
        }
    }

    return template;
}

/* public methods */
module.exports.formatError = formatError;
