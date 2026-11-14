import { aTimeout, expect } from '@open-wc/testing';
import { cycle, debounce, scrollLock } from './index';

describe('cycle', () => {
  const items = ['pen', 'pencil', 'chalk'];

  it('moves to the next item, and from the last back to the first', () => {
    expect(cycle(items, 'pen', 1)).to.equal('pencil');
    expect(cycle(items, 'chalk', 1)).to.equal('pen');
  });

  it('moves to the previous item, and from the first round to the last', () => {
    expect(cycle(items, 'chalk', -1)).to.equal('pencil');
    expect(cycle(items, 'pen', -1)).to.equal('chalk');
  });

  it('starts from the first or the last item for one that isn’t in the list', () => {
    expect(cycle(items, 'brush', 1)).to.equal('pen');
    expect(cycle(items, 'brush', -1)).to.equal('chalk');
  });
});

describe('debounce', () => {
  it('calls the function once the calls have stopped for `wait`, with the last arguments and `this`', async () => {
    const calls: Array<[unknown, string]> = [];
    const target = {
      save: debounce(function (this: unknown, value: string) {
        calls.push([this, value]);
      }, 50),
    };

    target.save('a');
    target.save('b');
    await aTimeout(20);
    expect(calls).to.deep.equal([]);
    await aTimeout(60);

    expect(calls).to.deep.equal([[target, 'b']]);
  });

  it('drops the pending call on `clear`', async () => {
    let called = false;
    const save = debounce(() => (called = true), 20);

    save();
    save.clear();
    await aTimeout(40);

    expect(called).to.be.false;
  });
});

describe('scrollLock', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  it('hides the page’s overflow until the lock is released', () => {
    const lock = scrollLock(document.createElement('div'));
    expect(document.body.style.overflow).to.equal('hidden');

    lock.abort();

    expect(document.body.style.overflow).to.equal('');
  });

  it('releases the lock when the signal it is given aborts', () => {
    const controller = new AbortController();
    scrollLock(document.createElement('div'), { abortSignal: controller.signal });

    controller.abort();

    expect(document.body.style.overflow).to.equal('');
  });

  it('keeps the page locked until every lock is released, in any order', () => {
    document.body.style.overflow = 'auto';
    const first = scrollLock(document.createElement('div'));
    const second = scrollLock(document.createElement('div'));

    first.abort();
    expect(document.body.style.overflow).to.equal('hidden');
    second.abort();

    expect(document.body.style.overflow).to.equal('auto');
  });
});
