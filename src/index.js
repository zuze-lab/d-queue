// export const stateArgumentProcessor = ([next], last = []) => [next, last[1]];
const identity = a => a;
export default (processor = identity) => {
  let updating = 0;
  const pending = new Map();
  const lastCalledWith = new WeakMap();

  const process = (fn, args) => {
    fn(...processor(args, lastCalledWith.get(fn)));
    lastCalledWith.set(fn, args);
    pending.delete(fn);
  };

  const flush = () =>
    updating ||
    [...pending.entries()].some(([fn, args]) => updating || process(fn, args));

  const dequeue = fn => pending.delete(fn);
  const tick = r => (updating--, flush(), r);

  return {
    dequeue,
    run: fn => {
      updating++;
      const done = r =>
        r && typeof r.then === 'function' ? r.then(tick) : tick(r);

      // TIL about fn.length: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length
      return fn.length ? fn(done) : done(fn());
    },
    enqueue: (fn, args = []) => {
      pending.set(fn, args) && flush();
      return () => dequeue(fn);
    },
  };
};
