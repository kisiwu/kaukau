const DeepPropertyAccess = require('deep-property-access');

function Parameters(params) {
  let parametersBag = [{}];
  let count;

  let currentParameters = {};

  if (params && typeof params === 'object' && !Array.isArray(params)) {
    params = [params];
  }
  if (Array.isArray(params) && params.length) {
    parametersBag = params;
  }

  this.all = () => {
    return parametersBag;
  };

  this.size = () => {
    return parametersBag.length;
  };

  this.next = () => {
    if (typeof count === 'undefined') {
      count = 0;
    } else {
      count++;
    }
    if (count >= parametersBag.length) {
      currentParameters = {};
    } else {
      currentParameters = parametersBag[count] || {};
      return count + 1;
    }
  };

  // ctx
  this.get = (path) => {
    if (typeof path === 'string' || Array.isArray(path)) {
      return DeepPropertyAccess(currentParameters, path);
    } else if (typeof path === 'undefined' || path === null) {
      return currentParameters;
    }
  };
}

module.exports = Parameters;
