// A FIFO lock. runExclusive() queues the task behind whatever is already
// running, so tasks execute one at a time in arrival order. The flash sale
// service uses one of these per sale to make claims atomic.
export class Mutex {
  #tail = Promise.resolve();

  runExclusive(task) {
    const result = this.#tail.then(task);
    // Keep the chain alive if a task throws, otherwise every later task
    // would be stuck behind a rejected promise.
    this.#tail = result.catch(() => {});
    return result;
  }
}
