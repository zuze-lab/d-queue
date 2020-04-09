// export const stateArgumentProcessor = ([next], last = []) => [next, last[1]];
const identity = <T>(a: T) => a;

type ArgumentProcessor = (next: Args[], last?: Args[]) => Args;
type Fn = (...args: Args) => void;
type Args = any[];

export type RunFunction = (done?: () => void) => any | void | Promise<any>;

export default (processor: ArgumentProcessor = identity) => {
  let updating = 0;
  const pending = new Map<Fn,Args>();
  const lastCalledWith = new WeakMap<Fn,Args>();

  const process = (fn: Fn, args: any[]) => {
    fn.apply(fn,processor(args, lastCalledWith.get(fn)));
    lastCalledWith.set(fn, args);
    pending.delete(fn);
    return false;
  };

  const flush = () =>
    updating ||
    Array.from(pending.entries()).some(
      ([fn, args]) => (!!updating) || process(fn, args),
    );

  const dequeue = (fn: Fn) => pending.delete(fn);
  const tick = <T>(r: T) => (updating--, flush(), r);

  return {
    dequeue,
    // while this function is running, nothing added to the queue will be processed
    run: (fn: RunFunction) => {
      updating++;
      const done = (r?: Promise<any> | any) =>
        r && typeof r.then === 'function' ? r.then(tick) : tick(r);

      // TIL about fn.length: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length
      fn.length ? fn(done) : done(fn());
    },
    enqueue: (fn: Fn, args = []) => {
      if(pending.set(fn, args)) flush();
      return () => dequeue(fn);
    },
  };
};
