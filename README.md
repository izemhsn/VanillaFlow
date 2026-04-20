# VanillaFlow

[![license](https://img.shields.io/github/license/izemhsn/VanillaFlow.svg)](./LICENSE)

A tiny (~1.4 KB gzipped) vanilla JavaScript library for declarative DOM manipulation with reactive directives. Zero dependencies, no build step required.

## Features

- **Declarative directives** — bind data to the DOM using HTML attributes
- **Zero dependencies** — pure vanilla JavaScript
- **No build step** — drop it in and go
- **ES module & global** — works with `import` or a `<script>` tag
- **Tiny footprint** — single file, ~1.4 KB gzipped

## Install

Grab either file directly from this repo (or the assets of a GitHub release) — **no build step, no package manager required.**

- [`VanillaFlow.js`](./VanillaFlow.js) — readable source (~6 KB)
- [`VanillaFlow.min.js`](./VanillaFlow.min.js) — minified (~1.4 KB gzipped)

Put it next to your HTML and import it as a module:

```html
<script type="module">
  import VanillaFlow from './VanillaFlow.min.js';
  new VanillaFlow({ message: 'Hello!' }).init();
</script>
```

The library also exposes itself as `window.VanillaFlow` once loaded, so you can use it from classic scripts too:

```html
<script type="module" src="./VanillaFlow.min.js"></script>
<script>
  new VanillaFlow({ message: 'Hello!' }).init();
</script>
```

## Quick Start

```html
<div>
  <p x-text="message"></p>
  <button x-on:click="count++">Clicked <span x-text="count"></span> times</button>
</div>

<script type="module">
  import VanillaFlow from './VanillaFlow.js';

  new VanillaFlow({
    message: 'Hello, VanillaFlow!',
    count: 0
  }).init();
</script>
```

## Directives

### `x-text`

Sets the **text content** of an element.

```html
<span x-text="message"></span>
```

### `x-html`

Sets the **inner HTML** of an element.

```html
<div x-html="htmlContent"></div>
```

### `x-model`

Two-way data binding for **input elements**. Updates the bound property on every `input` event and re-renders all `x-text` directives.

```html
<input x-model="name" placeholder="Enter your name">
<p>Hello, <span x-text="name"></span></p>
```

### `x-show`

Toggles an element's **visibility** (`display: none`) based on a truthy/falsy expression.

```html
<div x-show="isVisible">Now you see me</div>
```

### `x-if`

**Conditionally renders** an element. Unlike `x-show`, the element is **removed from the DOM** when the expression is falsy.

```html
<div x-if="isLoggedIn">Welcome back!</div>
```

### `x-bind` / `x-bind:[attr]`

Dynamically binds an **attribute** value.

- `true` → attribute is set (empty value)
- `false` / `null` / `undefined` → attribute is removed
- Any other value → attribute is set to that value

```html
<!-- Bind a class -->
<div x-bind:class="isActive ? 'active' : ''">Styled</div>

<!-- Bind disabled -->
<button x-bind:disabled="isSubmitting">Submit</button>
```

### `x-on:[event]`

Attaches an **event listener**. Supports `.prevent` and `.stop` modifiers.

```html
<button x-on:click="increment()">+1</button>

<!-- With modifiers -->
<a href="/somewhere" x-on:click.prevent="handleClick()">Stay here</a>

<!-- Multiple modifiers -->
<div x-on:click.stop.prevent="doSomething()">...</div>
```

### `x-for`

Loops over an **array** and clones the element for each item. Supports an optional index via destructuring syntax.

```html
<!-- Simple -->
<ul>
  <li x-for="item in items">
    <span x-text="item"></span>
  </li>
</ul>

<!-- With index -->
<ol>
  <li x-for="(item, index) in items">
    <span x-text="index + 1 + '. ' + item"></span>
  </li>
</ol>
```

## Data & Methods

Pass a plain object to the constructor. Functions are automatically bound to the data object so `this` refers to the data.

```js
new VanillaFlow({
  count: 0,
  items: ['Apple', 'Banana', 'Cherry'],

  increment() {
    this.count++;
  }
}).init();
```

## Expressions

All directive values are **JavaScript expressions** evaluated with the data object's properties in scope. You can use any valid JS expression:

```html
<span x-text="firstName + ' ' + lastName"></span>
<div x-show="items.length > 0"></div>
<p x-text="count > 1 ? 'items' : 'item'"></p>
```

## API

### `new VanillaFlow(data)`

Creates a new instance. `data` is a plain object whose properties and methods become available in directive expressions. Methods are automatically bound so `this` inside them refers to `data`.

### `.init(root?)`

Processes all directives inside `root` and returns the instance. `root` defaults to `document.body`; pass an element to scope an instance to a subtree (two instances on the same page can coexist this way).

```js
const app = new VanillaFlow({ message: 'Hi' }).init();
// or scope to a specific element:
new VanillaFlow(data).init(document.getElementById('app'));
```

### `.refresh()`

Re-evaluates all `x-text`, `x-html`, `x-show`, and `x-bind:*` bindings. Called automatically after every `x-model` input, `change`, and `x-on:*` event. Call it manually if you mutate `data` outside of event handlers:

```js
setInterval(() => {
  app.data.count++;
  app.refresh();
}, 1000);
```

## Caveats

- **`x-for` list size is not reactive.** The list length is rendered once at `init()` time; mutating the array afterwards won't add or remove DOM nodes. Mutating **fields on existing items** (e.g. `items[0].name = 'Z'`) *is* reflected after the next `refresh()`.
- **`x-if` is one-shot.** When the expression is falsy at `init()`, the element is removed from the DOM and is not brought back.
- **`x-model` needs a property path.** Binding to a plain loop variable (`x-model="item"` inside `x-for="item in items"`) can't write back into the array. Use a property path instead: `x-model="item.value"`.
- **`x-model` input types.** Text inputs and `type="checkbox"` are supported. Radio groups, `<select multiple>`, and numeric coercion (`type="number"`, `"range"`, `"date"`) are not — bound values stay as strings.
- **`x-html` is an XSS sink.** Never pass untrusted strings to it.
- **Reserved name.** `__vfval` is used internally by `x-model`; avoid it as a `data` key. `$event` is reserved inside `x-on:*` handlers only.
- **Event modifiers supported:** `.prevent`, `.stop`. Others (`.once`, `.enter`, …) are not.
- **CSP.** Expressions are compiled with `new Function`, so a Content Security Policy must allow `'unsafe-eval'`.
- **One `init()` per instance.** Calling `init()` twice will re-attach listeners and double-process bindings; create a new instance instead.

## Development

```bash
npm install        # install terser for the minified build
npm run build      # produce VanillaFlow.min.js + source map
npm run dev        # serve the repo locally for index.html
```

## Browser Support

Works in all modern browsers that support ES modules and `new Function()`.

## License

[MIT](./LICENSE) &copy; El Houssaine Izem
