# Echoes <!-- omit in toc -->

> This is a fork of https://github.com/timberstack/echoes. I wanted to try out denoland as a CDN deploy platform, given the return of `deno bundle` in version 2.4 and its support for bundling for the browser.

> You can just import the exported functions from "https://deno.land/x/echoes@v0.0.3/mod.js". If you have Deno enabled in the workspace, you'll see the intellisense working as expected. Yay!

The `echoes` package is a very simple and straight-forward implementation of the [Observer Pattern](https://www.patterns.dev/vanilla/observer-pattern/). It also takes inspiration from several niceties found in [RxJs](https://github.com/ReactiveX/rxjs) and [Signals](https://github.com/preactjs/signals), such as:
- Explicit `subscribe` and  `unsubscribe`-like methods (RxJs)
- `until` method (RxJs)
- Computed reactive values (Signals)

Besides:
- Make **any value** reactive. It can be anything from a string to a WeakMap, implemented with no extra code
- Create events that are **not value dependent**. If you don't need your reactivity to be attached to any specific value, just use the Emitters for triggering events
- Less than **500b** minified + gzipped

## Project status <!-- omit in toc -->
This package is pretty new and we don't expect a crazy wild adoption. The API and the implementation are fairly simple, but please be aware that bugs might appear. If you find anything strange, please let us know by opening an issue.

Even though it's under active development, the API is stable and it's very unlikely to change. However, until we don't hit a v1, we cannot ensure that the API will remain intact. There are still a lot of work to do and we will try our best to not change the usage. But if a fix requires changing the API in order to keep the bundle size small, we should be open to minor adjustments.

- [Installation](#installation)
- [Reference (API/Usage)](#reference-apiusage)
  - [`echo(optionalInitialValue)`](#echooptionalinitialvalue)
    - [`echo.value`](#echovalue)
    - [`echo#subscribe`](#echosubscribe)
    - [`echo#next`](#echonext)
  - [`computed(callback, [dependencies])`](#computedcallback-dependencies)
  - [`Listener`](#listener)
    - [`Listener#mute`](#listenermute)
    - [`Listener#until`](#listeneruntil)
    - [`Listener#trigger(optionalMessage)`](#listenertriggeroptionalmessage)
- [License](#license)

## Installation

```js
import { echo, computed } from "https://deno.land/x/echoes@v0.0.3/mod.js"
```

## Reference (API/Usage)
### `echo(optionalInitialValue)`
The `echo` function creates a new echo instance with an optional initial value:

```javascript
const $count = echo(0)

const $map = echo(new Map())

const $statelessEvent = echo()
```

#### `echo.value`
This will return the current value of the echo (if any). Feel free to access it anywhere in your code, as it won't register or trigger any side effects:

```javascript
$count.value // -> 0

$map.value // -> Map instance

$statelessEvent.value // -> null
```

#### `echo#subscribe`
It accepts a callback that will be triggered whenever the `next` or `trigger` methods are invoked. The callback will receive the current value of the Emitter or any message provided with the `trigger` method.

```javascript
$count.listen((count) => console.log(count))

$map.listen((map) => console.log(map.get('awesomeKey'))

$statelessEvent.listen((optionalMessage) => console.log(optionalMessage ?? 'No message provided'))
```

Subscriptions are **not lazy by default**. They will run as soon as declared. If you need to run it lazily, you can pass an object with the `lazy` property set as `true` as a second argument:

```javascript
$count.listen(count) => doSomething(), { lazy: true })
```

In any case, it will return a `Listener` object. More on it later.

#### `echo#next`
This method will be responsible for mutating the value and triggering all subscriptions. You can either provide a new value directly or through a callback (recommended for complex data types):

```javascript
$count.next(2) // -> will set the value to 2 and trigger all subscriptions

$map.next((prev) => prev.set('hello', 'world')) // -> will mutate the value and then trigger the subscriptions

$statelessEvent.next('now we have value') // -> not recommended, but possible
```

### `computed(callback, [dependencies])`
The `computed` constructor returns an echo-like object with only a `listen` method and a value property. Its value will be computed based on the callback's return value and the echoes contained within the dependencies array:

```javascript
const $double = computed() => $count.value * 2, [ $count ])
```

Behind the scenes, it is creating an internal echo whose value is being updated every time the value of any of its dependencies change:

```javascript
$double.listen(value) => console.log(value))

$count.next(2) // -> will log 4
```

### `Listener`
Any `listen` method will return a `Listener` object that we can use to clear the listening itself.

#### `Listener#mute`
This will clear the listening on-demand:

```javascript
const $count = echo(0)
const listener = $count.listen((value) => console.log(value))

$count.next( $count.value + 1 ) // -> will log 1
listener.mute()
$count.next( $count.value + 1 ) // -> won't log anything
```

#### `Listener#until`
Heavily inspired by the `takeUntil` method from RxJs. Useful when we want the listening to take place only until a certain condition is met:

```javascript
const $count = echo(0)
const listener = $count.listen(value) => console.log(value))

listener.until((value) => value > 2)

$count.next( $count.value + 1 ) // -> will log 1
$count.next( $count.value + 1 ) // -> will log 2
$count.next( $count.value + 1 ) // -> won't log anything
```

#### `Listener#trigger(optionalMessage)`
This will trigger the callback without mutating the value of the Emitter. Useful for when we have a stateless Emitter. Optionally, it takes a message that will be passed on to the callback:

```javascript
const $onMessage = echo()
const messageEvent = $onMessage.listen(msg) => console.log(msg ?? 'no message provided'))

messageEvent.trigger('Hello world') // will log 'Hello world'
messageEvent.trigger() // will log 'no message provided'
```

## License
MIT