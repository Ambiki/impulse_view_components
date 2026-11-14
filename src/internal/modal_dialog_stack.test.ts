import { expect, fixture, nextFrame } from '@open-wc/testing';
import ModalDialogStack from './modal_dialog_stack';

/** Waits for a watch to hear a dialog open or close. */
async function heard() {
  await nextFrame();
  await nextFrame();
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
    await heard();
    first.showModal();
    await heard();
    expect(stack.topmost() === first).to.be.true;

    first.close();
    await heard();
    expect(stack.topmost() === second).to.be.true;

    second.close();
    stop();
  });

  it('takes a dialog closed and opened again in one task for the topmost, and tells its watcher', async () => {
    const { stack, first, second } = await setup();
    let changes = 0;
    const stop = stack.watch(() => changes++);
    first.showModal();
    await heard();
    second.showModal();
    await heard();
    const before = changes;

    first.close();
    first.showModal();
    await heard();

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
    await heard();
    nested.show();
    upper.showModal();
    await heard();

    nested.close();
    await heard();

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
    await heard();
    expect(changes).to.equal(1);

    first.close();
    await heard();
    expect(changes).to.equal(2);

    stop();
    first.showModal();
    await heard();
    expect(changes).to.equal(2);
    first.close();
  });

  it('tells its watcher of each dialog still open as it is stopped', async () => {
    const { stack, first } = await setup();
    let changes = 0;
    const stop = stack.watch(() => changes++);
    first.showModal();
    await heard();

    stop();

    expect(changes).to.equal(2);
    first.close();
  });
});
