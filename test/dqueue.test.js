import dq from '../src/index';
import { advanceTimersByTime } from './test.utils';
jest.useFakeTimers();

describe('debounce queue', () => {
  const asyncFixture = (time = 10) => ({
    promiseFn: () => new Promise(res => setTimeout(res, time)),
    asyncFn: done => setTimeout(done, time),
    time,
  });

  it('should run a function immediately', () => {
    const { enqueue } = dq();
    const fn = jest.fn();
    const args = [1, 'some string', 3];
    enqueue(fn, args);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);
  });

  it('should not run a function if something else is happening (promise)', async () => {
    const { enqueue, run } = dq();
    const fn = jest.fn();
    const { promiseFn, time } = asyncFixture();
    run(promiseFn);
    enqueue(fn);
    expect(fn).not.toHaveBeenCalled();

    // still not called
    await advanceTimersByTime(time - 1);
    expect(fn).not.toHaveBeenCalled();

    // called
    await advanceTimersByTime(1);

    expect(fn).toHaveBeenCalled();
  });

  it('should not run a function if something else is happening (done)', async () => {
    const { enqueue, run } = dq();
    const fn = jest.fn();
    const { asyncFn, time } = asyncFixture();
    run(asyncFn);
    enqueue(fn);
    expect(fn).not.toHaveBeenCalled();

    // still not called
    await advanceTimersByTime(time - 1);
    expect(fn).not.toHaveBeenCalled();

    // called
    await advanceTimersByTime(1);

    expect(fn).toHaveBeenCalled();
  });

  it('should not flush if multiple functions are running', async () => {
    const { enqueue, run } = dq();
    const fn = jest.fn();
    const { asyncFn, promiseFn, time } = asyncFixture();
    run(asyncFn);
    enqueue(fn);
    expect(fn).not.toHaveBeenCalled();

    // still not called
    await advanceTimersByTime(time - 1);
    expect(fn).not.toHaveBeenCalled();

    // run another function
    run(promiseFn);
    await advanceTimersByTime(1);

    expect(fn).not.toHaveBeenCalled();

    await advanceTimersByTime(time);
    expect(fn).toHaveBeenCalled();
  });

  it('should not call a function if it has been dequeued before being flushed', async () => {
    const { enqueue, dequeue, run } = dq();
    const fn = jest.fn();
    const { asyncFn, time } = asyncFixture();
    run(asyncFn);
    enqueue(fn);
    await advanceTimersByTime(time - 1);
    dequeue(fn);
    await advanceTimersByTime(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should not call a function if it has been dequeued (returned fn) before being flushed', async () => {
    const { enqueue, run } = dq();
    const fn = jest.fn();
    const { asyncFn, time } = asyncFixture();
    run(asyncFn);
    const dequeue = enqueue(fn);
    await advanceTimersByTime(time - 1);
    dequeue(fn);
    await advanceTimersByTime(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should call the argument processor appropriately', () => {
    const fn = jest.fn();
    const processor = jest.fn(() => ['something']);
    const firstArgs = [1, 2, 3];
    const secondArgs = [4, 5, 6];
    const thirdArgs = [7, 8, 9];
    const { enqueue } = dq(processor);
    enqueue(fn, firstArgs);
    enqueue(fn, secondArgs);
    enqueue(fn, thirdArgs);
    expect(processor).toHaveBeenNthCalledWith(1, firstArgs, undefined);
    expect(processor).toHaveBeenNthCalledWith(2, secondArgs, firstArgs);
    expect(processor).toHaveBeenNthCalledWith(3, thirdArgs, secondArgs);
    expect(fn).toHaveBeenCalledWith(...processor());
  });
});
