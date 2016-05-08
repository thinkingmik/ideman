var handleError = function(res, err) {
  var template = {
    status: 'ERR',
    type: err.name,
    message: err.message,
    stack: err.stack
  }

  var json = JSON.stringify(template);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.statusCode = err.status || 500;

  res.end(json);
}

var handleSuccess = function(res, extra) {
  var ret = {
    status: 'OK',
    data: extra
  }

  var json = JSON.stringify(ret);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.statusCode = 200;

  res.end(json);
}

module.exports.Error = handleError;
module.exports.Success = handleSuccess;
