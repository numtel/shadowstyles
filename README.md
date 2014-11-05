# Shadow Styles

[![Build Status](https://travis-ci.org/numtel/shadowstyles.svg?branch=master)](https://travis-ci.org/numtel/shadowstyles)

WebComponents bring Shadow DOM with isolated CSS to some browsers.
This script simulates CSS isolation for all modern browsers (IE9+, Firefox...).

## Installation
Coming soon, bower.

Manually add tag:
```html
<script src="build/shadowStyles.min.js"></script>
```

### document.shadowStyles(...)
Pass one argument: array, string, or element.
String provides a selector to match new shadow root elements.
Element provides a direct reference to a root element.
Array can contain a combination of both.

### Targeting simulated shadows

Shadowed elements are given a `shadow` attribute that must be present in the
selector:

```css
shadowed-element[shadow] p { color: blue; }
```

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
small changes as needed.

## Todo

* observe ancestors (skip siblings) for rule match changes

## Build

Build file is `build/shadowStyles.min.js`. From cloned repository:

```bash
# Install Grunt
$ npm install -g grunt-cli
# Run default operation
$ grunt
```

## Run Tests

From cloned repository:

```bash
# Install CasperJS
$ npm install -g casperjs
# Run Tests
$ npm test
```

## License

MIT
