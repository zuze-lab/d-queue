# d-queue

[![npm version](https://img.shields.io/npm/v/@zuze/d-queue.svg)](https://npmjs.org/package/@zuze/d-queue)
[![Coverage Status](https://coveralls.io/repos/github/zuze-lab/d-queue/badge.svg)](https://coveralls.io/github/zuze-lab/d-queue)
[![Build Status](https://travis-ci.com/zuze-lab/d-queue.svg)](https://travis-ci.com/zuze-lab/d-queue)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/@zuze/d-queue)](https://bundlephobia.com/result?p=@zuze/d-queue)
[![install size](https://packagephobia.now.sh/badge?p=@zuze/d-queue)](https://packagephobia.now.sh/result?p=@zuze/d-queue)

A DebounceQueue debounces functions to run only when a queue is idle.

## Create a DebounceQueue:

```js
import dq from '@zuze/d-queue';
...
const { run, queue, dequeue } = dq(argumentProcessor);
```

Add a function to be run when the queue is idle:
```js
queue(fnToBeRun,arguments)
```

If the queue is not busy, this function will be run immediately.
To make a queue busy, call `run` with a synchronous or asynchronous function.
No functions added to the queue while it is busy will be called.
After the queue becomes idle, all existing queued functions will be flushed.

### Why?
A DebounceQueue is highly useful for subscription-style callbacks that you do not want to get called while other things are happening.


### What's an argument processor?
In the case of subscriptions, the same function reference is typically added to a DebounceQueue between flushes. An argument processor is a function that accepts the current arguments the queued function should be flushed with and the last arguments the function was flushed with and returns an array of new arguments. The default argument processor is the identity function


### Example 

The below example uses Observables as the source of events, but they don't have to be. Plain callbacks/promises work just as well:

```js
const { run,  queue } = dq();

const myFunc = () => { ... };

// when some event happens, run someAsyncFunc and 
// prevent functions added to the queue from being called until it completes
someObservable$.subscribe(() => run(async () => await someAsyncFunc()))

// when some other event happens, run myFunc, 
// but only if the queue isn't busy doing something
someOtherObservable$.subscribe((...args) => queue(myFunc,args));
```

The purpose of this is to allow `myFunc` to be called only when `someAsyncFunc` isn't running.
This usually means that there is a dependency between the result of `someAsyncFunc` and `myFunc` and we don't want to waste work running `myFunc` if we know `someAsyncFunc` is running.

As soon as `someAsyncFunc` has completed, `myFunc` will be called.


## API

```js
const { queue, dequeue, run } = dq(argumentProcessor: (nextArgs = [], lastArgs = []) => any[])
```
Creates a new debounce queue. Returns `queue`, `dequeue`, and `run` functions.

- `queue (fn: Function, args?: any[])`
Accepts a function reference and (optionally) an array arguments that function should be called with. The function is run when the queue becomes idle.

- `dequeue (fn: Function)`
Removes a function reference from the queue.

- `run( done?:() => void | any | Promise<any> )`
Starts a process running. Any functions added to the queue will the process is running will not be run until the process is complete. It can be made async by either returning a promise or calling the `done` function passed to the callback as an argument.

Returning a promise and accepting a `done` parameter are mutually exclusive. If the callback function accepts a `done` parameter, it **must be called**.