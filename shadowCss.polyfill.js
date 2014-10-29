
(function(){
  var BUFFER_ATTR = 'data-css-selector';

  var updateShadowCss = function(nodeName, parsedCss) {
    var root = document.querySelectorAll(nodeName);
    var output = '';
    Array.prototype.forEach.call(root, function(rootEl){
      var children = rootEl.querySelectorAll('*');

      parsedCss.forEach(function(stylesheet){
        stylesheet.stylesheet.rules.forEach(function(rule, ruleIndex){
          if(rule.type === 'rule'){
            rule.selectors.forEach(function(selector, selectorIndex){
              // Check for shadow assimilation
              var shadowRegex = new RegExp(nodeName + '([^\s]+)?::shadow', 'g');
              if(shadowRegex.test(selector)){
                selector = selector.replace('::shadow', '');
                stylesheet.stylesheet.rules[ruleIndex].selectors[selectorIndex] = selector;
              }else{
                // Check for possible unique selector negations
                Array.prototype.forEach.call(children, function(child){
                  if(child.matches(selector)){
                    var selectorId;
                    // generate selector unique id if doesnt exist
                    if(selector.indexOf(':not(' + BUFFER_ATTR + '*=') === -1){
                      selectorId = randomString(10);
                      selector = selector + ':not([' + BUFFER_ATTR + '*="' + selectorId + '"])';
                      stylesheet.stylesheet.rules[ruleIndex].selectors[selectorIndex] = selector;
                    }else{
                      // selectorId is at end, capped by '"])'
                      selectorId = selector.substr(-13).substr(0,10);
                    };
                    // add unique id to child if not included
                    var attrVal = child.getAttribute(BUFFER_ATTR);
                    if(!attrVal){
                      child.setAttribute(BUFFER_ATTR, selectorId);
                    }else if(attrVal.indexOf(selectorId) === -1){
                      child.setAttribute(BUFFER_ATTR, attrVal + selectorId);
                    };
                  };
                });
              };
            });
          };
        });
        output += css.stringify(stylesheet);
      });
    });

    // Remove old sheets
    var oldSheets = document.querySelectorAll('style, link[rel=stylesheet]');
    Array.prototype.forEach.call(oldSheets, function(tag){
      tag.parentNode.removeChild(tag);
    })
    // Add in updated styles
    var head = document.head || document.getElementsByTagName('head')[0];
    var newStyle = document.createElement('style');

    newStyle.type = 'text/css';
    if (newStyle.styleSheet){
      newStyle.styleSheet.cssText = output;
    } else {
      newStyle.appendChild(document.createTextNode(output));
    }

    head.appendChild(newStyle);
  };


  // Load all the page's stylesheets and then call css event on document
  // TODO: @import, link media attr...
  var loadAllStyleSheets = function(callback) {
    var parsedCss = [];
    //read style tags
    var styleElements = document.querySelectorAll('style');
    Array.prototype.forEach.call(styleElements, function(style){
      parsedCss.push(css.parse(style.innerHTML));
    });
    //read linked stylesheets
    var linkCount = 0, linkReturn = 0;
    var linkElements = document.querySelectorAll("link[rel=stylesheet]");
    Array.prototype.forEach.call(linkElements, function(link){
      linkCount++;
      var path = link.href.slice(0, link.href.lastIndexOf("/") + 1);
      var request = new XMLHttpRequest();
      var onComplete = function() {
        linkReturn++;
        if(linkCount === linkReturn){
          callback(parsedCss);
        }
      }

      request.onload = function() {
        if (request.status >= 200 && request.status < 400){
          // Success!
          resp = request.responseText;
          parsedCss.push(css.parse(request.responseText));
        } else {
          // We reached our target server, but it returned an error

        }
        onComplete();
      };

      request.onerror = function() {
        // There was a connection error of some sort
        onComplete();
      };
      // Perform synchronous request (should already be cached)
      request.open('GET', link.href, false);
      request.send(null);
    });
  };

  var randomString = function(length){
    if(length === undefined){
      length = 10;
    };
    var text = "",
        possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
    for( var i=0; i < length; i++ ){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    };
    return text;
  };

  window.registerShadow = function(nodeName){
    loadAllStyleSheets(function(parsedCss){
      updateShadowCss(nodeName, parsedCss);
    });
  };

})();
