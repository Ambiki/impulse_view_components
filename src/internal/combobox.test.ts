import type { ComboboxOptions } from './combobox';
import { expect, fixture, html } from '@open-wc/testing';
import Combobox from './combobox';

interface Commit {
  option: HTMLElement;
  event: Event;
}

/** An input and a list of four options, the third disabled, with a combobox on them that records its commits. */
async function comboboxFixture(options: Partial<ComboboxOptions> = {}) {
  const container = await fixture<HTMLElement>(html`
    <div>
      <input type="text">
      <ul>
        <li role="option" id="apple"><span>Apple</span></li>
        <li role="option" id="banana">Banana</li>
        <li role="option" id="cherry" aria-disabled="true">Cherry</li>
        <li role="option">Damson</li>
      </ul>
    </div>
  `);
  const input = container.querySelector('input')!;
  const list = container.querySelector('ul')!;
  const commits: Commit[] = [];
  const combobox = new Combobox({
    input,
    list,
    onCommit: (option, event) => commits.push({ option, event }),
    ...options,
  });
  const [apple, banana, cherry, damson] = combobox.options;

  return { combobox, input, list, commits, apple, banana, cherry, damson };
}

/** Presses `key` in `input`, and returns the `keydown` event so that callers can tell whether it was prevented. */
function pressKey(input: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  input.dispatchEvent(event);
  return event;
}

function mouse(target: Element, type: string) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('Combobox', () => {
  describe('roles and states', () => {
    it('should make the input a combobox that controls the list', async () => {
      const { input, list } = await comboboxFixture();

      expect(input.getAttribute('role')).to.equal('combobox');
      expect(input.getAttribute('aria-haspopup')).to.equal('listbox');
      expect(input.getAttribute('aria-autocomplete')).to.equal('list');
      expect(input.getAttribute('aria-expanded')).to.equal('false');
      expect(list.getAttribute('role')).to.equal('listbox');
      expect(list.id).not.to.equal('');
      expect(input.getAttribute('aria-controls')).to.equal(list.id);
    });

    it('should keep the id the list already has', async () => {
      const container = await fixture<HTMLElement>(html`<div><input><ul id="fruits"></ul></div>`);
      const input = container.querySelector('input')!;

      // eslint-disable-next-line no-new
      new Combobox({ input, list: container.querySelector('ul')!, onCommit: () => {} });

      expect(input.getAttribute('aria-controls')).to.equal('fruits');
    });

    it('should set `aria-expanded` only between `start` and `stop`', async () => {
      const { combobox, input } = await comboboxFixture();

      combobox.start();
      expect(input.getAttribute('aria-expanded')).to.equal('true');

      combobox.stop();
      expect(input.getAttribute('aria-expanded')).to.equal('false');
    });

    it('should leave selection to the element', async () => {
      const { combobox, input, list, apple } = await comboboxFixture();
      combobox.start();
      combobox.activate(apple);

      pressKey(input, 'Enter');
      combobox.stop();

      expect(list.querySelector('[aria-selected]')).to.equal(null);
      expect(input.hasAttribute('aria-multiselectable')).to.equal(false);
    });
  });

  describe('the active option', () => {
    it('should mark the option and point the input to it', async () => {
      const { combobox, input, banana } = await comboboxFixture();

      combobox.activate(banana);

      expect(combobox.activeOption).to.equal(banana);
      expect(banana.hasAttribute('data-active')).to.equal(true);
      expect(input.getAttribute('aria-activedescendant')).to.equal('banana');
    });

    it('should give an id to an option that has none', async () => {
      const { combobox, input, damson } = await comboboxFixture();

      combobox.activate(damson);

      expect(damson.id).not.to.equal('');
      expect(input.getAttribute('aria-activedescendant')).to.equal(damson.id);
    });

    it('should keep one option active at a time', async () => {
      const { combobox, list, apple, banana } = await comboboxFixture();

      combobox.activate(apple);
      combobox.activate(banana);

      expect([...list.querySelectorAll('[data-active]')]).to.eql([banana]);
    });

    it('should leave no option active with `deactivate`', async () => {
      const { combobox, input, apple } = await comboboxFixture();
      combobox.activate(apple);

      combobox.deactivate();

      expect(combobox.activeOption).to.equal(null);
      expect(input.hasAttribute('aria-activedescendant')).to.equal(false);
    });

    it('should leave no option active with `stop`', async () => {
      const { combobox, input, apple } = await comboboxFixture();
      combobox.start();
      combobox.activate(apple);

      combobox.stop();

      expect(combobox.activeOption).to.equal(null);
      expect(input.hasAttribute('aria-activedescendant')).to.equal(false);
    });
  });

  describe('arrow keys', () => {
    it('should move to the first option with ArrowDown and the last with ArrowUp when none is active', async () => {
      const { combobox, input, apple, damson } = await comboboxFixture();
      combobox.start();

      expect(pressKey(input, 'ArrowDown').defaultPrevented).to.equal(true);
      expect(combobox.activeOption).to.equal(apple);

      combobox.deactivate();
      expect(pressKey(input, 'ArrowUp').defaultPrevented).to.equal(true);
      expect(combobox.activeOption).to.equal(damson);
    });

    it('should move through the options, disabled ones too, and wrap at either end', async () => {
      const { combobox, input, apple, banana, cherry, damson } = await comboboxFixture();
      combobox.start();
      combobox.activate(banana);

      pressKey(input, 'ArrowDown');
      expect(combobox.activeOption).to.equal(cherry);

      pressKey(input, 'ArrowDown');
      pressKey(input, 'ArrowDown');
      expect(combobox.activeOption).to.equal(apple);

      pressKey(input, 'ArrowUp');
      expect(combobox.activeOption).to.equal(damson);
    });

    it('should skip an option that is hidden, or sits in something hidden', async () => {
      const { combobox, input, list, apple, banana, cherry, damson } = await comboboxFixture();
      const group = document.createElement('div');
      group.hidden = true;
      group.append(cherry);
      list.append(group);
      banana.hidden = true;
      combobox.start();
      combobox.activate(apple);

      pressKey(input, 'ArrowDown');
      expect(combobox.activeOption).to.equal(damson);

      pressKey(input, 'ArrowDown');
      expect(combobox.activeOption).to.equal(apple);
    });

    it('should move to the first option when the active one has been hidden', async () => {
      const { combobox, input, apple, banana } = await comboboxFixture();
      combobox.start();
      combobox.activate(banana);
      banana.hidden = true;

      pressKey(input, 'ArrowDown');

      expect(combobox.activeOption).to.equal(apple);
    });

    it('should leave the arrow keys alone when no option can be seen', async () => {
      const { combobox, input, list } = await comboboxFixture();
      list.hidden = true;
      combobox.start();

      pressKey(input, 'ArrowDown');

      expect(combobox.activeOption).to.equal(null);
    });

    it('should leave the keys to the input until it starts, and after it stops', async () => {
      const { combobox, input } = await comboboxFixture();

      expect(pressKey(input, 'ArrowDown').defaultPrevented).to.equal(false);

      combobox.start();
      combobox.stop();

      expect(pressKey(input, 'ArrowDown').defaultPrevented).to.equal(false);
      expect(combobox.activeOption).to.equal(null);
    });
  });

  describe('committing with the keyboard', () => {
    it('should commit the active option with Enter, passing the key press', async () => {
      const { combobox, input, commits, banana } = await comboboxFixture();
      combobox.start();
      combobox.activate(banana);

      const event = pressKey(input, 'Enter');

      expect(commits).to.eql([{ option: banana, event }]);
      expect(event.defaultPrevented).to.equal(true);
    });

    it('should leave Enter to the input when no option is active', async () => {
      const { combobox, input, commits } = await comboboxFixture();
      combobox.start();

      expect(pressKey(input, 'Enter').defaultPrevented).to.equal(false);
      expect(commits).to.eql([]);
    });

    it('should not commit a disabled option with Enter, nor let Enter through', async () => {
      const { combobox, input, commits, cherry } = await comboboxFixture();
      combobox.start();
      combobox.activate(cherry);

      expect(pressKey(input, 'Enter').defaultPrevented).to.equal(true);
      expect(commits).to.eql([]);
    });

    it('should leave Enter alone while an input method is composing', async () => {
      const { combobox, input, commits, banana } = await comboboxFixture();
      combobox.start();
      combobox.activate(banana);

      expect(pressKey(input, 'Enter', { isComposing: true }).defaultPrevented).to.equal(false);
      expect(commits).to.eql([]);
    });

    it('should leave alone the Enter that Safari sends as a composition ends', async () => {
      const { combobox, input, commits, banana } = await comboboxFixture();
      combobox.start();
      combobox.activate(banana);

      // Safari sends it after `compositionend`, so `isComposing` is already `false`.
      expect(pressKey(input, 'Enter', { keyCode: 229 }).defaultPrevented).to.equal(false);
      expect(commits).to.eql([]);
    });

    it('should let Tab move focus without committing by default', async () => {
      const { combobox, input, commits, banana } = await comboboxFixture();
      combobox.start();
      combobox.activate(banana);

      expect(pressKey(input, 'Tab').defaultPrevented).to.equal(false);
      expect(commits).to.eql([]);
    });

    it('should commit the active option with Tab when `tabCommits` is set', async () => {
      const { combobox, input, commits, banana } = await comboboxFixture({ tabCommits: true });
      combobox.start();
      combobox.activate(banana);

      const event = pressKey(input, 'Tab');

      expect(commits).to.eql([{ option: banana, event }]);
      expect(event.defaultPrevented).to.equal(true);
    });

    it('should let Tab move focus when it has nothing to commit', async () => {
      const { combobox, input, commits, cherry } = await comboboxFixture({ tabCommits: true });
      combobox.start();

      expect(pressKey(input, 'Tab').defaultPrevented).to.equal(false);

      combobox.activate(cherry);

      expect(pressKey(input, 'Tab').defaultPrevented).to.equal(false);
      expect(commits).to.eql([]);
    });

    it('should let Shift+Tab move focus back without committing', async () => {
      const { combobox, input, commits, banana } = await comboboxFixture({ tabCommits: true });
      combobox.start();
      combobox.activate(banana);

      expect(pressKey(input, 'Tab', { shiftKey: true }).defaultPrevented).to.equal(false);
      expect(commits).to.eql([]);
    });
  });

  describe('other keys', () => {
    for (const key of ['a', 'ArrowLeft', 'Home', 'End', 'Escape']) {
      it(`should return to the input on ${key}, leaving no option active and the key alone`, async () => {
        const { combobox, input, banana } = await comboboxFixture();
        combobox.start();
        combobox.activate(banana);

        expect(pressKey(input, key).defaultPrevented).to.equal(false);
        expect(combobox.activeOption).to.equal(null);
      });
    }

    for (const modifier of ['shiftKey', 'altKey', 'ctrlKey', 'metaKey'] as const) {
      it(`should leave a key held with ${modifier} alone, and the active option as it is`, async () => {
        const { combobox, input, banana } = await comboboxFixture();
        combobox.start();
        combobox.activate(banana);

        expect(pressKey(input, 'ArrowDown', { [modifier]: true }).defaultPrevented).to.equal(false);
        pressKey(input, 'a', { [modifier]: true });

        expect(combobox.activeOption).to.equal(banana);
      });
    }
  });

  describe('pointer', () => {
    it('should activate the option the pointer moves over', async () => {
      const { combobox, apple } = await comboboxFixture();
      combobox.start();

      mouse(apple.querySelector('span')!, 'mousemove');

      expect(combobox.activeOption).to.equal(apple);
    });

    it('should keep the active option when the list scrolls another under a still pointer', async () => {
      const { combobox, apple, banana } = await comboboxFixture();
      combobox.start();
      combobox.activate(banana);

      mouse(apple, 'mouseover');

      expect(combobox.activeOption).to.equal(banana);
    });

    it('should commit the option the user clicks, passing the click', async () => {
      const { combobox, commits, apple } = await comboboxFixture();
      combobox.start();

      const event = mouse(apple.querySelector('span')!, 'click');

      expect(commits).to.eql([{ option: apple, event }]);
    });

    it('should not commit a disabled option, nor a click between the options', async () => {
      const { combobox, list, commits, cherry } = await comboboxFixture();
      combobox.start();

      mouse(cherry, 'click');
      mouse(list, 'click');

      expect(commits).to.eql([]);
    });

    it('should keep a press on the list from taking focus from the input', async () => {
      const { combobox, apple } = await comboboxFixture();
      combobox.start();

      expect(mouse(apple, 'mousedown').defaultPrevented).to.equal(true);
    });

    it('should leave the pointer alone once it stops', async () => {
      const { combobox, commits, apple } = await comboboxFixture();
      combobox.start();
      combobox.stop();

      mouse(apple, 'mousemove');
      mouse(apple, 'click');

      expect(combobox.activeOption).to.equal(null);
      expect(commits).to.eql([]);
    });
  });
});
