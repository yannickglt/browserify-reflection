var path = require('path');
var reflection = require('reflection-instrumenter');
var through = require('through');
var minimatch = require('minimatch');

var defaultIgnore = ['**/node_modules/**', '**/bower_components/**', '**/test/**', '**/tests/**', '**/*.json'];

function shouldIgnoreFile(file, options) {
  var ignore = options.defaultIgnore === false ? [] : defaultIgnore;
  ignore = ignore.concat(options.ignore || []);

  return ignore.some(function(pattern) {
    return minimatch(file, pattern, options.minimatchOptions);
  });
}

module.exports = function(options, extraOptions) {
  options = options || {};

  function transform(file) {
    if (shouldIgnoreFile(file, options))
      return through();

    var data = '';
    return through(function(buf) {
      data += buf;
    }, function() {
      var self = this;
      var code = reflection.instrument(data, getPath(file), file);
      if (code) {
        self.queue(code);
      }
      self.queue(null);
    });
  }

  function getPath (filePath) {
    filePath = path.relative(process.cwd(), filePath);
    var pathParts = path.parse(filePath);
    var returnPath = pathParts.dir.replace('.', '_').split(path.sep);
    returnPath.push(pathParts.name.replace('.', '_'));
    return returnPath.join('/');
  }

  if (typeof options === 'string') {
    var file = options;
    options = extraOptions || {};
    return transform(file);
  }

  return transform;
};
