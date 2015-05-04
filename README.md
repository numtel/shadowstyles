# Shadow Styles

[![Build Status](https://travis-ci.org/numtel/shadowstyles.svg?branch=master)](https://travis-ci.org/numtel/shadowstyles)

WebComponents bring Shadow DOM with isolated CSS to some browsers.
This script simulates CSS isolation for all modern browsers (IE9+, Firefox...).

## Installation
```
npm install shadowstyles
```

Or downoad the built file and manually add tag:
```html
<script src="build/shadowStyles.min.js"></script>
```

## document.shadowStyles()
Pass one argument: array, string, or element.
String provides a selector to match new shadow root elements.
Element provides a direct reference to a root element.
Array can contain a combination of both.

```javascript
// Example with selector string only
document.shadowStyles('x-foo');

// Example with array containing both types
document.shadowStyles([
  'x-foo', // All x-foo elements will have shadow styled children
  document.getElementById('something') // Specific element
]);
```

## Targeting simulated shadows

Shadowed elements are given a `shadow` attribute that must be present in the
selector:

```css
shadowed-element[shadow] p { color: blue; }
```

## Detecting native support

When using in conjunction with the Platform.js Shadow DOM polyfill, it can be
useful to know whether the shadow DOM is emulated. Check the boolean constant:

```javascript
document.shadowStyles.nativeSupport
```

**Note:** I'm considering wrapping the polyfilled `createShadowRoot()` to
automatically isolate the shadow CSS, also allowing `createShadowRoot(false)`
to skip style isolation. See `test/mockup/webcomponent.html` for implementation
details.

## How it works

1. Search for child DOM of elements to isolate.
2. Find which rules apply to those elements and add a `:not(buffer-attr*="uniqueId")`
    pseudo-class with a unique ID to each rule. Shadowed elements gain the buffer
    attribute containing the unique ID of each negated rule.

### Why not `::shadow`?

Originally, the plan of this project was to support styles using the native
`::shadow` pseudo-class syntax. Until the fifteenth commit, this worked, but
only if all the page's stylesheets were rewritten completely. By only
using selectors that the browser already supports, the script can skip parsing
all of your CSS itself and rely on the browser's interpretation, only making
small changes as needed. The final result is much smoother operation.

## Still to do

* Handle nested shadow DOM correctly

## Build / Run Tests

```bash
# Clone repository to current directory
$ git clone https://github.com/numtel/shadowstyles.git
$ cd shadowstyles
$ npm install
# Install Grunt Client
$ npm install -g grunt-cli

# Run default operation to build minified file
$ grunt

# Running tests locally requires Selenium jar in repo
# http://selenium-release.storage.googleapis.com/index.html
# For example, 2.45.0:
$ wget http://selenium-release.storage.googleapis.com/2.45/selenium-server-standalone-2.45.0.jar
# If not running 2.45.0, update filename in GruntFile.js

# Test using grunt-nightwatch:
$ grunt nightwatch:local
# Or use default test command alias:
$ npm test
```

## License

MIT
