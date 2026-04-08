# VanillaFlow

A lightweight (~170 LOC) vanilla JavaScript library for declarative DOM manipulation with reactive directives. Zero dependencies, no build step required.

## Features

- **Declarative directives** — bind data to the DOM using HTML attributes
- **Zero dependencies** — pure vanilla JavaScript
- **No build step** — drop it in and go
- **ES module & global** — works with `import` or a `<script>` tag
- **Tiny footprint** — single file, under 170 lines

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

Creates a new instance. `data` is a plain object whose properties and methods become available in directive expressions.

### `.init()`

Processes all directives in the document and returns the instance.

```js
const app = new VanillaFlow({ message: 'Hi' }).init();
```

## Browser Support

Works in all modern browsers that support ES modules and `new Function()`.

## License

MIT
