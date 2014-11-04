// Downloaded from https://github.com/c9/smith/blob/master/tests/public/test.js#L2-L7
Function.prototype.bind = Function.prototype.bind || function (thisp) {
  var fn = this;
  return function () {
    return fn.apply(thisp, arguments);
  };
};
