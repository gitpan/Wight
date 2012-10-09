/*
Copyright (c) 2011 Jonathan Leighton

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var Poltergeist,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Poltergeist = (function() {

  function Poltergeist(port, width, height) {
    var env, server, service, that,
      _this = this;
    this.port = port;
    this.browser = new Poltergeist.Browser(this, width, height);
    this.connection = new Poltergeist.Connection(this, port);
    that = this;
    phantom.onError = function(message, stack) {
      return that.sendError(message, stack);
    };
    env = require('system').env;
    if (env['SCREENSHOT_PORT']) {
      server = require('webserver').create();
      service = server.listen(env['SCREENSHOT_PORT'], function(req, res) {
        res.statusCode = 200;
        console.log(req.url);
        if (req.url === '/image') {
          res.write(_this.browser.page["native"].renderBase64('PNG'));
        } else {
          res.headers = {
            'Content-Type': 'text/html'
          };
          res.write("<img><script>+" + (function() {
            var xhr;
            xhr = new XMLHttpRequest();
            xhr.open('GET', '/image', false);
            xhr.send();
            return document.querySelector('img').src = "data:image/png;base64," + xhr.responseText;
          }) + "()</script>");
        }
        return res.close();
      });
    }
    this.running = false;
  }

  Poltergeist.prototype.runCommand = function(command) {
    this.running = true;
    try {
      return this.browser[command.name].apply(this.browser, command.args);
    } catch (error) {
      if (error instanceof Poltergeist.Error) {
        return this.sendError(error);
      } else {
        return this.sendError(new Poltergeist.BrowserError(error.toString(), error.stack));
      }
    }
  };

  Poltergeist.prototype.sendResponse = function(response) {
    return this.send({
      response: response
    });
  };

  Poltergeist.prototype.sendError = function(error) {
    return this.send({
      error: {
        name: error.name || 'Generic',
        args: error.args && error.args() || [error.toString()]
      }
    });
  };

  Poltergeist.prototype.send = function(data) {
    if (this.running) {
      this.connection.send(data);
      return this.running = false;
    }
  };

  return Poltergeist;

})();

window.Poltergeist = Poltergeist;

Poltergeist.Error = (function() {

  function Error() {}

  return Error;

})();

Poltergeist.ObsoleteNode = (function(_super) {

  __extends(ObsoleteNode, _super);

  function ObsoleteNode() {
    return ObsoleteNode.__super__.constructor.apply(this, arguments);
  }

  ObsoleteNode.prototype.name = "Poltergeist.ObsoleteNode";

  ObsoleteNode.prototype.args = function() {
    return [];
  };

  ObsoleteNode.prototype.toString = function() {
    return this.name;
  };

  return ObsoleteNode;

})(Poltergeist.Error);

Poltergeist.ClickFailed = (function(_super) {

  __extends(ClickFailed, _super);

  function ClickFailed(selector, position) {
    this.selector = selector;
    this.position = position;
  }

  ClickFailed.prototype.name = "Poltergeist.ClickFailed";

  ClickFailed.prototype.args = function() {
    return [this.selector, this.position];
  };

  return ClickFailed;

})(Poltergeist.Error);

Poltergeist.JavascriptError = (function(_super) {

  __extends(JavascriptError, _super);

  function JavascriptError(errors) {
    this.errors = errors;
  }

  JavascriptError.prototype.name = "Poltergeist.JavascriptError";

  JavascriptError.prototype.args = function() {
    return [this.errors];
  };

  return JavascriptError;

})(Poltergeist.Error);

Poltergeist.BrowserError = (function(_super) {

  __extends(BrowserError, _super);

  function BrowserError(message, stack) {
    this.message = message;
    this.stack = stack;
  }

  BrowserError.prototype.name = "Poltergeist.BrowserError";

  BrowserError.prototype.args = function() {
    return [this.message, this.stack];
  };

  return BrowserError;

})(Poltergeist.Error);

phantom.injectJs("" + phantom.libraryPath + "/web_page.js");

phantom.injectJs("" + phantom.libraryPath + "/node.js");

phantom.injectJs("" + phantom.libraryPath + "/connection.js");

phantom.injectJs("" + phantom.libraryPath + "/browser.js");

new Poltergeist(phantom.args[0], phantom.args[1], phantom.args[2]);
