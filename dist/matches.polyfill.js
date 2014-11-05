// Adapted from https://developer.mozilla.org/en-US/docs/Web/API/Element.matches
var elProto = Element.prototype;
if(!elProto.matches){
  // Try for native implementation
  [ 'msMatchesSelector',
    'webkitMatchesSelector',
    'mozMatchesSelector',
    'oMatchesSelector' ].forEach(function(alternative){
    if(alternative in elProto){
      elProto.matches = elProto[alternative];
    };
  });
};

if(!elProto.matches){
  // Finally provide javascript implementation
  elProto.matches = function (selector) {
    var element = this;
    var matches = (element.document || element.ownerDocument).querySelectorAll(selector);
    var i = 0;
    
    while (matches[i] && matches[i] !== element) {
      i++;
    }

    return matches[i] ? true : false;
  }
}
