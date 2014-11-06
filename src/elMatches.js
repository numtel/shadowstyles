// shadowStyles CSS Isolator
// MIT License, ben@latenightsketches.com
// src/elMatches.js

// Create reference to prefixed rule match method 
// Must be loaded before webcomponents.js
window.elMatches = (function(){
  var options = [
    'matches',
    'msMatchesSelector',
    'webkitMatchesSelector',
    'mozMatchesSelector',
    'oMatchesSelector'];
  for(var i = 0; i < options.length; i++){
    if(options[i] in document.documentElement){
       return document.documentElement[options[i]];
    };
  };
})();
