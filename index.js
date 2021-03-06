const http = require('https');
const URL = require('url');
const querystring = require('querystring');

const WilddogRest = function (url) {
  this.url = url;
  var _url = URL.parse(url);
  this.hostname = _url.hostname;
  this.path = _url.pathname;
  this.query = querystring.parse(_url.query);
};
module.exports = WilddogRest;
WilddogRest.prototype.auth = function (token) {
  this.authToken = token;
  this.query || {};
  this.query.auth = token;
  return this;
}
WilddogRest.prototype.limitToFirst = function (num) {
  this.query || {};
  this.query.limitToFirst = num;
  return this;
}
WilddogRest.prototype.limitToLast = function (num) {
  this.query || {};
  this.query.limitToLast = num;
  return this;
}
WilddogRest.prototype.startAt = function (start) {
  this.query || {};
  this.query.startAt = start;
  return this;
}
WilddogRest.prototype.endAt = function (end) {
  this.query || {};
  this.query.endAt = end;
  return this;
}
WilddogRest.prototype.equalTo = function (equal) {
  this.query || {};
  this.query.equalTo = equal;
  return this;
}
WilddogRest.prototype.isShallow = function (shallow) {
  this.query || {};
  this.query.shallow = shallow;
  return this;
}
//callback(err,data);
WilddogRest.prototype.get = function (callback, cancelCallack) {
  var _callback = callback;
  var _cancelCallback = cancelCallack;
  var options = {
    hostname: this.hostname,
    port: 443,
    path: this.path + '.json',
  };
  if (this.query != null) {
    options.path += '?' + querystring.stringify(this.query);
  }
  var req = http.get(options, function (res) {
    var buffers = [];
    var len = 0;
    res.on('data', (d) => {
      buffers.push(d);
      len += d.length;
    });
    res.on('end', () => {
      const buffer = Buffer.concat(buffers, len);
      var resObj = null;
      try {
        resObj = JSON.parse(buffer.toString());
        if (_callback) {
          _callback(resObj);
          _callback = null;
        }
      }
      catch (e) {
        if (_cancelCallback) {
          _cancelCallback(e);
          _cancelCallback = null;
        }
      }
    });
  });
  req.on('error', function (e) {
    _cancelCallback(e);
  });
  req.end();
}
WilddogRest.prototype.put = function (data, callback) {
  var options = {
    hostname: this.hostname,
    port: 443,
    path: this.path + '.json',
    method: 'PUT',
    headers: {
      'Content-Type': 'text/json',
    }
  };
  if (this.query != null) {
    options.path += '?' + querystring.stringify(this.query);
  }
  var req = http.request(options, function (res) {
    res.on('end', function () {
      callback(null);
    })
  });
  req.on('error', function (e) {
    callback(e);
  });
  req.write(JSON.stringify(data));
  req.end();

};
WilddogRest.prototype.post = function (data, callback) {
  var options = {
    hostname: this.hostname,
    port: 443,
    path: this.path + '.json',
    method: 'POST',
    headers: {
      'Content-Type': 'text/json',
    }
  };
  if (this.query != null) {
    options.path += '?' + querystring.stringify(this.query);
  }
  var req = http.request(options, function (res) {
    res.on('data', function (d) {
      var returnObj = JSON.parse(d.toString());
      if (returnObj.name != null) {
        callback(null, returnObj.name);
      }
    });
    res.on('end', function () {
      //do nothing
    })
  });
  req.on('error', function (e) {
    callback(e);
  });
  req.write(JSON.stringify(data));
  req.end();
};
WilddogRest.prototype.patch = function (data, callback) {
  var options = {
    hostname: this.hostname,
    port: 443,
    path: this.path + '.json',
    method: 'PATCH',
    headers: {
      'Content-Type': 'text/json',
    }
  };
  if (this.query != null) {
    options.path += '?' + querystring.stringify(this.query);
  }
  var req = http.request(options, function (res) {
    res.on('end', function () {
      callback(null);
    })
  });
  req.on('error', function (e) {
    callback(e);
  });
  req.write(JSON.stringify(data));
  req.end();
};

WilddogRest.prototype.delete = function (data, callback) {
  var options = {
    hostname: this.hostname,
    port: 443,
    path: this.path + '.json',
    method: 'DELETE',
    headers: {
      'Content-Type': 'text/json',
    }
  };
  if (this.query != null) {
    options.path += '?' + querystring.stringify(this.query);
  }
  var req = http.request(options, function (res) {
    res.on('end', function () {
      callback(null);
    })
  });
  req.on('error', function (e) {
    callback(e);
  });
  req.write(JSON.stringify(data));
  req.end();
};

WilddogRest.prototype.stream = function (dataCallback, cancelCallback) {
  var options = {
    hostname: this.hostname,
    port: 443,
    path: this.path + '.json',
    method: 'GET',
    headers: {
      'accept': 'text/event-stream',
      'connection': 'keep-alive'
    }
  };
  if (this.query != null) {
    options.path += '?' + querystring.stringify(this.query);
  }
  var self = this;
  var req = http.request(options, function (res) {
    self.tick = setTimeout(function () {
      cancelCallback(new Error('disconnected'));
      clearTimeout(self.tick);
    }, 60000);
    var buffers = [];
    res.on('data', function (d) {
      var idx = d.indexOf(new Buffer('\n\n'));
      if (idx < 0) {
        buffers.push(d);
      }
      else {
        buffers.push(d.slice(0, idx));
        var buf = Buffer.concat(buffers);

        var event = new ServerEvent(buf, self.path);
        if (event.type == 'put' || event.type == 'patch' ) {
          dataCallback(event);
        }
        else if (event.type == 'keep-alive') {
          clearTimeout(self.tick);
          self.tick = setTimeout(function () {
            cancelCallback(new Error('disconnected'));
            clearTimeout(self.tick);
          }, 60000);
        }
        buffers = [];
      }
    });
    res.on('end', function () {
      if (cancelCallback)
        cancelCallback(new Error('response ended'));
    })
  });
  req.on('error', function (e) {
    if (cancelCallback)
      cancelCallback(e);
  });
  req.end();
}

function ServerEvent(buffer, basePath) {
  var dataIdx = buffer.indexOf('\n') + 1;
  if (buffer.indexOf(new Buffer('event:')) == 0) {
    var ev = buffer.slice(6, dataIdx - 1).toString();
    this.type = ev;
    this.basePath = basePath;
    this._parseData(buffer.slice(dataIdx, buffer.length));
  }
}
ServerEvent.prototype._parseData = function (linebuf) {
  if (linebuf.indexOf(new Buffer('data:')) != 0) {
    this.data = null;
    return;
  }
  var databuf = linebuf.slice(6, linebuf.length);
  var data = JSON.parse(databuf);
  if (data != null) {
    this.data = data.data;
    this.path = data.path;
    this.key = getKey(this.path, this.basePath);
  }
}
function getKey(url, baseUrl) {
  function _getKey(url) {
    return url.split('/')[1]
  }
  if (url == null || url.length < 1 || url == '/') {
    return null;
  }
  if (url[0] != '/') {
    url = '/' + url;
  }
  if (url[url.length - 1] == '/') {
    url = url.substr(0, url.length - 1);
  }
  if (baseUrl == '/' || baseUrl == null || baseUrl == '') {
    return _getKey(url);
  }
  if (baseUrl[0] != '/') {
    baseUrl = '/' + baseUrl;
  }
  if (baseUrl[baseUrl.length - 1] == '/') {
    baseUrl = baseUrl.substr(0, url.length - 1);
  }
  if (url.indexOf(baseUrl) != 0) {
    return null;
  }
  var subUrl = url.substr(baseUrl.length)
  return _getKey(subUrl);
}
function isLeaf(key, url) {
  if (url[url.length - 1] == '/') {
    url = url.substr(0, url.lenth - 1);
  }
  return url.indexOf(key) == url.length - key.length
}
