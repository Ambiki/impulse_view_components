import { fixture, recordEvents, whenSettled } from '@ambiki/impulse/testing';
import ModalDialogStack from './modal_dialog_stack';

/**
 * Closes `dialog`, and waits for a watch to hear it: Impulse's report that `[open]` went, and the `close` event the
 * browser dispatches later.
 */
async function close(dialog: HTMLDialogElement) {
  const closed = recordEvents(dialog, ['close'], { self: true });
  dialog.close();
  await closed.waitFor('close');
  await whenSettled();
}

/** Closes `dialog` and shows it modally again in one task, and waits for a watch to hear it, as `close` does. */
async function closeAndReopen(dialog: HTMLDialogElement) {
  const closed = recordEvents(dialog, ['close'], { self: true });
  dialog.close();
  dialog.showModal();
  await closed.waitFor('close');
  await whenSettled();
}

describe('ModalDialogStack', () => {
  async function setup() {
    const container = await fixture<HTMLDivElement>('<div><dialog id="first"></dialog><dialog id="second"></dialog></div>');
    const first = container.querySelector<HTMLDialogElement>('#first')!;
    const second = container.querySelector<HTMLDialogElement>('#second')!;
    return { stack: new ModalDialogStack(), first, second };
  }

  it('has no topmost dialog while none is open modally', async () => {
    const { stack, first } = await setup();
    expect(stack.topmost()).to.equal(null);

    first.show();

    expect(stack.topmost()).to.equal(null);
    first.close();
  });

  it('takes a modal dialog it hasn’t heard of for the topmost, and drops it once it closes', async () => {
    const { stack, first } = await setup();

    first.showModal();
    expect(stack.topmost() === first).to.be.true;

    first.close();
    expect(stack.topmost()).to.equal(null);
  });

  it('keeps the dialogs it watches in the order they opened, wherever they are in the page', async () => {
    const { stack, first, second } = await setup();
    const stop = stack.watch(() => {});

    second.showModal();
    await whenSettled();
    first.showModal();
    await whenSettled();
    expect(stack.topmost() === first).to.be.true;

    await close(first);
    expect(stack.topmost() === second).to.be.true;

    second.close();
    stop();
  });

  it('takes a dialog closed and opened again in one task for the topmost, and tells its watcher', async () => {
    const { stack, first, second } = await setup();
    let changes = 0;
    const stop = stack.watch(() => changes++);
    first.showModal();
    await whenSettled();
    second.showModal();
    await whenSettled();
    const before = changes;

    await closeAndReopen(first);

    expect(stack.topmost() === first).to.be.true;
    expect(changes).to.be.greaterThan(before);
    first.close();
    second.close();
    stop();
  });

  it('keeps its order when a dialog nested in a lower one closes', async () => {
    const container = await fixture<HTMLDivElement>(
      '<div><dialog id="lower"><dialog id="nested"></dialog></dialog><dialog id="upper"></dialog></div>',
    );
    const [lower, nested, upper] = ['#lower', '#nested', '#upper'].map(
      (selector) => container.querySelector<HTMLDialogElement>(selector)!,
    );
    const stack = new ModalDialogStack();
    const stop = stack.watch(() => {});
    lower.showModal();
    await whenSettled();
    nested.show();
    upper.showModal();
    await whenSettled();

    await close(nested);

    expect(stack.topmost() === upper).to.be.true;
    upper.close();
    lower.close();
    stop();
  });

  it('tells its watcher as a dialog opens and as it closes, until it is stopped', async () => {
    const { stack, first } = await setup();
    let changes = 0;
    const stop = stack.watch(() => changes++);

    first.showModal();
    await whenSettled();
    expect(changes).to.equal(1);

    await close(first);
    expect(changes).to.equal(2);

    stop();
    first.showModal();
    await whenSettled();
    expect(changes).to.equal(2);
    first.close();
  });

  it('tells its watcher of each dialog still open as it is stopped', async () => {
    const { stack, first } = await setup();
    let changes = 0;
    const stop = stack.watch(() => changes++);
    first.showModal();
    await whenSettled();

    stop();

    expect(changes).to.equal(2);
    first.close();
  });
});
