import { expect, fixture, html } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import focusTrap from './focus_trap';

describe('focus_trap', () => {
  it('should focus the first element within the container', async () => {
    const el = await fixture<HTMLElement>(html`
      <div>
        <button type="button">Button</button>
        <div id="container">
          <button type="button">Button 1</button>
        </div>
      </div>
    `);

    const container = el.querySelector<HTMLElement>('#container')!;
    focusTrap(container);
    const traps = Array.from(el.querySelectorAll('[data-sentinel-for]'));

    expect(document.activeElement).to.equal(container.querySelector('button'));
    expect(container).to.have.attribute('data-focus-trap-id');
    expect(container).not.to.contain(traps[0]); // surround is true by default.
  });

  it('should focus on the element that has the data-autofocus attribute', async () => {
    const el = await fixture<HTMLElement>(html`
      <div id="container">
        <button type="button">Button 1</button>
        <button id="button" type="button" data-autofocus>Button 2</button>
      </div>
    `);

    focusTrap(el);
    expect(document.activeElement).to.equal(el.querySelector('#button'));
  });

  it('should cycle the focus from the last element to the first element and vice-versa', async () => {
    const el = await fixture<HTMLElement>(html`
      <div id="container">
        <button id="button1" type="button">Button 1</button>
        <button id="button2" type="button">Button 2</button>
        <button id="button3" type="button">Button 3</button>
      </div>
    `);

    focusTrap(el);
    const button1 = el.querySelector<HTMLButtonElement>('#button1')!;
    const button2 = el.querySelector<HTMLButtonElement>('#button2')!;
    const button3 = el.querySelector<HTMLButtonElement>('#button3')!;

    expect(document.activeElement).to.equal(button1);

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button2);
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button3);
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button1);
    await sendKeys({ press: 'Shift+Tab' });
    expect(document.activeElement).to.equal(button3);
    await sendKeys({ press: 'Shift+Tab' });
    expect(document.activeElement).to.equal(button2);
    await sendKeys({ press: 'Shift+Tab' });
    expect(document.activeElement).to.equal(button1);
  });

  it('should prevent the focus from leaving the trap', async () => {
    const el = await fixture<HTMLElement>(html`
      <div>
        <button id="button1" type="button">Button 1</button>
        <div id="container">
          <button id="button2" type="button">Button 2</button>
        </div>
      </div>
    `);

    const container = el.querySelector<HTMLElement>('#container')!;
    const button1 = el.querySelector<HTMLButtonElement>('#button1')!;
    const button2 = el.querySelector<HTMLButtonElement>('#button2')!;
    focusTrap(container);
    button1.focus();

    expect(document.activeElement).to.equal(button2);
  });

  it('should be able to nest the focus trap', async () => {
    const el = await fixture<HTMLElement>(html`
      <div>
        <button id="button1" type="button">Button 1</button>
        <div id="nested-container">
          <button id="button2" type="button">Button 2</button>
          <button id="button3" type="button">Button 3</button>
        </div>
      </div>
    `);

    const button1 = el.querySelector<HTMLButtonElement>('#button1')!;
    const nestedContainer = el.querySelector<HTMLElement>('#nested-container')!;
    const button2 = el.querySelector<HTMLButtonElement>('#button2')!;
    const button3 = el.querySelector<HTMLButtonElement>('#button3')!;

    focusTrap(el);
    expect(document.activeElement).to.equal(button1);
    const nestedTrap = focusTrap(nestedContainer);
    expect(document.activeElement).to.equal(button2);

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button3);

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button2);

    nestedTrap.abort();
    button1.focus();

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button2);

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button3);

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button1);
  });

  it('should be able to trap the focus within elements without any correlation', async () => {
    const el = await fixture<HTMLElement>(html`
      <div>
        <div id="container1">
          <button id="button1" type="button">Button 1</button>
          <button id="button2" type="button">Button 2</button>
        </div>
        <div id="container2">
          <button id="button3" type="button">Button 3</button>
          <button id="button4" type="button">Button 4</button>
        </div>
      </div>
    `);

    const container1 = el.querySelector<HTMLElement>('#container1')!;
    const container2 = el.querySelector<HTMLElement>('#container2')!;
    const button1 = el.querySelector<HTMLButtonElement>('#button1')!;
    const button2 = el.querySelector<HTMLButtonElement>('#button2')!;
    const button3 = el.querySelector<HTMLButtonElement>('#button3')!;
    const button4 = el.querySelector<HTMLButtonElement>('#button4')!;

    focusTrap(container1);
    expect(document.activeElement).to.equal(button1);
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button2);
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button1);

    const trap2 = focusTrap(container2);
    expect(document.activeElement).to.equal(button3);
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button4);
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button3);

    trap2.abort();
    button1.focus();

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button2);
    // Make sure trap exists on the first container.
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button1);
  });

  it('should be able to handle dynamic contents', async () => {
    const el = await fixture<HTMLElement>(html`
      <div>
        <button id="button1" type="button">Button 1</button>
        <button id="button2" type="button">Button 2</button>
      </div>
    `);

    const button1 = el.querySelector<HTMLButtonElement>('#button1')!;
    const button2 = el.querySelector<HTMLButtonElement>('#button2')!;
    focusTrap(el);
    expect(document.activeElement).to.equal(button1);

    const button = document.createElement('button');
    button.id = 'dynamic-button';
    el.append(button);

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button2);

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(el.querySelector('#dynamic-button'));

    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(button1);

    await sendKeys({ press: 'Shift+Tab' });
    expect(document.activeElement).to.equal(el.querySelector('#dynamic-button'));
  });

  it('should be able to release the focus trap', async () => {
    const el = await fixture<HTMLElement>(html`
      <div>
        <button type="button">Button</button>
        <div id="container">
          <button type="button">Button 1</button>
        </div>
      </div>
    `);

    const container = el.querySelector<HTMLElement>('#container')!;
    const trap = focusTrap(container);

    expect(container).to.have.attribute('data-focus-trap-id');

    trap.abort();
    expect(container).not.to.have.attribute('data-focus-trap-id');
  });

  it('appends and prepends the trap', async () => {
    const el = await fixture<HTMLElement>(html`
      <div>
        <button type="button">Button</button>
        <div id="container"></div>
      </div>
    `);

    const container = el.querySelector<HTMLElement>('#container')!;
    focusTrap(container, { surround: false });
    const traps = Array.from(el.querySelectorAll('[data-sentinel-for]'));

    expect(container).to.contain(traps[0]);
  });
});
