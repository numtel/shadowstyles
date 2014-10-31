// Saved from https://developer.mozilla.org/en-US/docs/Web/API/Element.matches
if(!Element.prototype.matches){
  Element.prototype.matches = function (selector) {
    var element = this;
    var matches = (element.document || element.ownerDocument).querySelectorAll(selector);
    var i = 0;
    
    while (matches[i] && matches[i] !== element) {
      i++;
    }

    return matches[i] ? true : false;
  }
}
