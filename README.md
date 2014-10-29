# Experimental Shadow DOM CSS Polyfill

Bring support for isolated CSS in shadow elements to browsers that do not natively support `Element.createShadowRoot()`. (Firefox, IE9+)

Use at your own risk! Still under construction. [View Demo](http://numtel.github.io/shadowcss-polyfill-demo)

## Todo

* link media attribute pass through
* do not remove sheets that weren't loaded
* support multiple element types concurrently
* provide mechanism for refreshing styles without reloading css
