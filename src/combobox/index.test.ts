import { expect, fixture } from '@open-wc/testing';
import Combobox from './index';

interface OptionFixture {
  id: string;
  selected?: boolean;
  active?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

async function comboboxFixture(options: OptionFixture[]) {
  const activeOption = options.find((option) => option.active);
  const optionsHtml = options
    .map(
      (option) =>
        `<li role="option" id="${option.id}" aria-selected="${option.selected ? 'true' : 'false'}"
          ${option.active ? 'data-active' : ''} ${option.disabled ? 'aria-disabled="true" disabled' : ''}
          ${option.hidden ? 'hidden' : ''}>
          <svg data-test-id="option-inner"></svg>
          Option
        </li>`,
    )
    .join('');

  const container = await fixture<HTMLElement>(`
    <div>
      <input type="text" ${activeOption ? `aria-activedescendant="${activeOption.id}"` : ''}>
      <ul>${optionsHtml}</ul>
    </div>
  `);

  const input = container.querySelector('input')!;
  const list = container.querySelector('ul')!;
  return {
    container,
    input,
    list,
    options: Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')),
    combobox: new Combobox(input, list),
  };
}

function pressKey(input: HTMLInputElement, key: string) {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/** Moves the pointer onto `option`, the way a user does before it can activate options. */
function hover(option: HTMLElement) {
  option.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
  option.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
}

/** Records the ids of the options that emit `combobox:commit` inside `container`, in order. */
function recordCommits(container: HTMLElement) {
  const commits: string[] = [];
  container.addEventListener('combobox:commit', (event) => commits.push((event.target as HTMLElement).id));
  return commits;
}

function expectActive(input: HTMLInputElement, option: HTMLElement) {
  expect(option.hasAttribute('data-active')).to.equal(true);
  expect(input.getAttribute('aria-activedescendant')).to.equal(option.id);
}

describe('Combobox', () => {
  it('should give the input and the list their roles when it is created', async () => {
    const { input, list } = await comboboxFixture([{ id: '1' }]);

    expect(input.getAttribute('aria-expanded')).to.equal('false');
    expect(input.getAttribute('role')).to.equal('combobox');
    expect(input.getAttribute('aria-haspopup')).to.equal('listbox');
    expect(input.getAttribute('aria-autocomplete')).to.equal('list');
    expect(list.hasAttribute('id')).to.equal(true);
    expect(list.getAttribute('role')).to.equal('listbox');
  });

  it('should expand the input and prepare the options when it starts', async () => {
    const { input, list, options, combobox } = await comboboxFixture([{ id: '1' }]);
    options[0].removeAttribute('id');

    combobox.start();

    expect(input.getAttribute('aria-expanded')).to.equal('true');
    expect(input.getAttribute('aria-controls')).to.equal(list.id);
    expect(options[0].getAttribute('tabindex')).to.equal('-1');
    expect(options[0].hasAttribute('id')).to.equal(true);
  });

  it('should collapse the input and deactivate the active option when it stops', async () => {
    const { input, options, combobox } = await comboboxFixture([{ id: '1', active: true }]);

    combobox.start();
    combobox.stop();

    expect(input.getAttribute('aria-expanded')).to.equal('false');
    expect(input.hasAttribute('aria-controls')).to.equal(false);
    expect(input.hasAttribute('aria-activedescendant')).to.equal(false);
    expect(options[0].hasAttribute('data-active')).to.equal(false);
  });

  it('should deactivate the active option with Escape', async () => {
    const { input, options, combobox } = await comboboxFixture([{ id: '1', active: true }]);
    combobox.start();

    pressKey(input, 'Escape');

    expect(options[0].hasAttribute('data-active')).to.equal(false);
    expect(combobox.activeOption).to.equal(null);
  });

  it('should cycle down through the visible options with ArrowDown', async () => {
    const { input, options, combobox } = await comboboxFixture([
      { id: '1' },
      { id: '2', disabled: true },
      { id: '3', hidden: true },
    ]);
    combobox.start();

    pressKey(input, 'ArrowDown');
    expectActive(input, options[0]);

    pressKey(input, 'ArrowDown');
    expectActive(input, options[1]);

    pressKey(input, 'ArrowDown');
    expectActive(input, options[0]);
  });

  it('should cycle up through the visible options with ArrowUp', async () => {
    const { input, options, combobox } = await comboboxFixture([
      { id: '1' },
      { id: '2', disabled: true },
      { id: '3', hidden: true },
    ]);
    combobox.start();

    pressKey(input, 'ArrowUp');
    expectActive(input, options[1]);

    pressKey(input, 'ArrowUp');
    expectActive(input, options[0]);

    pressKey(input, 'ArrowUp');
    expectActive(input, options[1]);
  });

  it('should activate the first visible option with Home and the last with End', async () => {
    const { input, options, combobox } = await comboboxFixture([{ id: '1' }, { id: '2' }, { id: '3', hidden: true }]);
    combobox.start();

    pressKey(input, 'End');
    expectActive(input, options[1]);

    pressKey(input, 'Home');
    expectActive(input, options[0]);
  });

  it('should commit the active option with Enter and with Tab', async () => {
    const { container, input, combobox } = await comboboxFixture([{ id: '1' }]);
    combobox.start();
    const commits = recordCommits(container);

    pressKey(input, 'ArrowDown');
    pressKey(input, 'Enter');
    pressKey(input, 'Tab');

    expect(commits).to.eql(['1', '1']);
  });

  it('should not commit a disabled option', async () => {
    const { container, input, options, combobox } = await comboboxFixture([{ id: '1', disabled: true }]);
    combobox.start();
    const commits = recordCommits(container);

    pressKey(input, 'ArrowDown');
    expectActive(input, options[0]);
    pressKey(input, 'Enter');
    pressKey(input, 'Tab');
    options[0].click();

    expect(commits).to.eql([]);
  });

  it('should commit the option that is clicked, from anywhere inside it', async () => {
    const { container, options, combobox } = await comboboxFixture([{ id: '1' }, { id: '2' }]);
    combobox.start();
    const commits = recordCommits(container);

    options[0].click();
    options[1].querySelector<SVGElement>('[data-test-id="option-inner"]')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(commits).to.eql(['1', '2']);
  });

  it('should activate the option the pointer moves onto', async () => {
    const { input, options, combobox } = await comboboxFixture([{ id: '1' }, { id: '2' }]);
    combobox.start();

    hover(options[1]);

    expectActive(input, options[1]);
  });

  it('should activate the option it is given, and deactivate the others', async () => {
    const { input, options, combobox } = await comboboxFixture([{ id: '1' }, { id: '2', active: true }]);
    combobox.start();

    combobox.activate(options[0]);

    expectActive(input, options[0]);
    expect(options[1].hasAttribute('data-active')).to.equal(false);
    expect(combobox.activeOption?.id).to.equal('1');
  });

  describe('selection', () => {
    it('should leave the selection to the element that handles the commit', async () => {
      const { container, options, combobox } = await comboboxFixture([{ id: '1' }, { id: '2', selected: true }]);
      combobox.start();
      const commits = recordCommits(container);

      options[0].click();

      expect(commits).to.eql(['1']);
      expect(options[0].getAttribute('aria-selected')).to.equal('false');
      expect(options[1].getAttribute('aria-selected')).to.equal('true');
    });

    it('should keep the selection when it starts and stops', async () => {
      const { options, combobox } = await comboboxFixture([{ id: '1', selected: true }, { id: '2' }]);
      options[1].removeAttribute('aria-selected');

      combobox.start();
      expect(options[1].hasAttribute('aria-selected')).to.equal(false);

      combobox.stop();
      expect(options[0].getAttribute('aria-selected')).to.equal('true');
    });

    it('should not mark the input or the list as multiselectable', async () => {
      const { input, list, options, combobox } = await comboboxFixture([{ id: '1' }]);
      combobox.start();
      options[0].click();

      expect(input.hasAttribute('aria-multiselectable')).to.equal(false);
      expect(list.hasAttribute('aria-multiselectable')).to.equal(false);
    });
  });

  it('should stop listening when it stops', async () => {
    const { container, input, options, combobox } = await comboboxFixture([{ id: '1' }]);
    combobox.start();
    combobox.stop();
    const commits = recordCommits(container);

    pressKey(input, 'ArrowDown');
    options[0].click();

    expect(combobox.activeOption).to.equal(null);
    expect(commits).to.eql([]);
  });
});
