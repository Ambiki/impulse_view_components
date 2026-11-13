import type AwcToastRegionElement from './region';
import type AwcToastElement from './toast';
import { whenInitialized } from '@ambiki/impulse';
import { aTimeout, expect, fixture, nextFrame } from '@open-wc/testing';
import { Idiomorph } from 'idiomorph';
// Registers both elements. Kept separate from the type imports above, which the bundler elides.
import { showToast } from './index';
// Registers `awc-dialog`, which the region moves into while it is open.
import '../dialog/index';

/**
 * Mirrors `app/components/impulse/toast_component.html.erb`: the parts the element reads, its close button and its
 * body.
 */
function toastHtml(attributes = '', message = '', title: string | null = null) {
  return `
    <awc-toast class="awc-toast" tabindex="-1" data-action="keydown->awc-toast#handleKeydown" ${attributes}>
      <div class="awc-toast-body">
        ${title === null ? '' : `<div class="awc-toast-title">${title}</div>`}
        <div class="awc-toast-message">${message}</div>
      </div>
      <button type="button" class="awc-toast-close-btn" data-action="click->awc-toast#requestHide" aria-label="Close notification">x</button>
    </awc-toast>
  `;
}

/** Mirrors `app/components/impulse/toast_region_component.html.erb`, whose template's toast has an empty title. */
function regionHtml(attributes = '', toasts = '') {
  return `
    <awc-toast-region id="awc-toast-region" popover="manual" role="region" aria-label="Notifications (F8)" ${attributes}>
      <template data-target="awc-toast-region.template">${toastHtml('', '', '')}</template>
      <div aria-live="polite" aria-atomic="true" data-target="awc-toast-region.politeAnnouncer"></div>
      <div aria-live="assertive" aria-atomic="true" data-target="awc-toast-region.assertiveAnnouncer"></div>
      ${toasts}
    </awc-toast-region>
  `;
}

/** Prevents the next `awc-toast:<name>` event that reaches `element`. */
function preventNext(element: HTMLElement, name: 'show' | 'hide') {
  element.addEventListener(`awc-toast:${name}`, (event) => event.preventDefault(), { once: true });
}

function closeButton(toast: AwcToastElement) {
  return toast.querySelector<HTMLButtonElement>('.awc-toast-close-btn')!;
}

async function regionFixture(attributes = '', toasts = '') {
  const region = await fixture<AwcToastRegionElement>(regionHtml(attributes, toasts));
  await whenInitialized(region);
  return region;
}

const EVENTS = ['show', 'shown', 'hide', 'hidden'] as const;

/** Records, in order, the `awc-toast:*` events that reach `element`, with the id of the toast each came from. */
function recordEvents(element: HTMLElement) {
  const events: string[] = [];
  for (const name of EVENTS) {
    element.addEventListener(`awc-toast:${name}`, (event) => {
      events.push(`${name} ${(event.target as HTMLElement).id}`.trim());
    });
  }
  return events;
}

describe('showToast', () => {
  it('shows a toast built from the region’s template, emitting `shown`', async () => {
    const region = await regionFixture();
    const events = recordEvents(region);

    const toast = (await showToast('Saved', { variant: 'success', id: 'saved' })) as AwcToastElement;

    expect(toast.open).to.be.true;
    expect(toast.parentElement === region).to.be.true;
    expect(toast.variant).to.equal('success');
    expect(toast.querySelector('.awc-toast-message')!.textContent).to.equal('Saved');
    expect(events).to.deep.equal(['shown saved']);
    expect(region.matches(':popover-open')).to.be.true;
  });
});

describe('showToast content', () => {
  it('updates the showing toast with the same id in place, starting its timer over, and emits nothing', async () => {
    const region = await regionFixture();
    const deleting = (await showToast('Deleting event…', { id: 'delete', duration: Infinity }))!;
    await showToast('Saved', { id: 'saved' });
    await announced();
    const events = recordEvents(region);

    const deleted = await showToast('Event deleted', { id: 'delete', variant: 'success', duration: 200 });
    await announced();

    expect(deleted === deleting).to.be.true;
    expect(region.toasts.map((toast) => toast.id)).to.deep.equal(['delete', 'saved']);
    expect(deleting.variant).to.equal('success');
    expect(deleting.querySelector('.awc-toast-message')!.textContent).to.equal('Event deleted');
    expect(events).to.deep.equal([]);
    expect(announcers(region)()).to.deep.equal(['Event deleted', '']);
    await aTimeout(300);
    expect(deleting.isConnected).to.be.false;
  });

  it('shows a toast cloned from a template, and updates it when shown again', async () => {
    const region = await regionFixture();
    const template = await fixture<HTMLTemplateElement>(
      `<template>${toastHtml('id="clipboard-toast" variant="success"', 'Copied to clipboard')}</template>`,
    );

    const toast = (await showToast(template))!;
    const again = await showToast(template);

    expect(toast.id).to.equal('clipboard-toast');
    expect(toast.variant).to.equal('success');
    expect(again === toast).to.be.true;
    expect(region.toasts.length).to.equal(1);
  });

  it('gives a toast the title it is given', async () => {
    await regionFixture();

    const toast = (await showToast('We kept a copy of your work.', { title: 'You’re offline' }))!;

    expect(toast.querySelectorAll('.awc-toast-body > .awc-toast-title + .awc-toast-message').length).to.equal(1);
    expect(toast.querySelector('.awc-toast-title')!.textContent).to.equal('You’re offline');
  });

  it('warns and shows nothing when the page has no region', async () => {
    const warn = console.warn;
    const warnings: unknown[] = [];
    console.warn = (...args: unknown[]) => warnings.push(args[0]);
    try {
      expect(await showToast('Saved')).to.equal(null);
    } finally {
      console.warn = warn;
    }
    expect(warnings).to.have.length(1);
  });
});

describe('<awc-toast-region>', () => {
  it('shows the toasts rendered into it as they connect, emitting `shown` for each', async () => {
    const container = await fixture<HTMLDivElement>('<div></div>');
    const events = recordEvents(container);

    container.innerHTML = regionHtml(
      '',
      toastHtml('id="created"', 'Goal created.') + toastHtml('id="failed" variant="danger"', 'Couldn’t sync.'),
    );
    const toasts = Array.from(container.querySelectorAll('awc-toast'));
    await Promise.all(toasts.map((toast) => whenInitialized(toast)));

    expect(toasts.map((toast) => toast.open)).to.deep.equal([true, true]);
    expect(events).to.deep.equal(['shown created', 'shown failed']);
  });

  it('drops a toast copied from a page restored from cache, without showing it again', async () => {
    const container = await fixture<HTMLDivElement>('<div></div>');
    container.innerHTML = regionHtml('', toastHtml('id="created"', 'Goal created.'));
    await whenInitialized(container.querySelector('awc-toast')!);
    // A cached page is a copy of the page as it was, open toasts and all.
    const snapshot = container.innerHTML;
    container.innerHTML = '';
    const events = recordEvents(container);

    container.innerHTML = snapshot;
    await whenInitialized(container.querySelector('awc-toast-region')!);
    await nextFrame();

    expect(container.querySelectorAll('awc-toast').length).to.equal(0);
    expect(events).to.deep.equal([]);
  });
});

describe('<awc-toast>', () => {
  it('requests to hide from its close button, and leaves the region once hidden', async () => {
    const region = await regionFixture();
    const toast = (await showToast('Saved', { id: 'saved' }))!;
    const events = recordEvents(region);

    closeButton(toast).click();
    await nextFrame();

    expect(events).to.deep.equal(['hide saved', 'hidden saved']);
    expect(toast.open).to.be.false;
    expect(toast.isConnected).to.be.false;
  });

  it('stays when its `hide` is prevented', async () => {
    const region = await regionFixture();
    const toast = (await showToast('Saved', { id: 'saved' }))!;
    const events = recordEvents(region);
    preventNext(region, 'hide');

    closeButton(toast).click();
    await nextFrame();

    expect(events).to.deep.equal(['hide saved']);
    expect(toast.open).to.be.true;
    expect(toast.parentElement === region).to.be.true;
  });

  it('emits only `hidden` when hidden from code', async () => {
    const region = await regionFixture();
    const toast = (await showToast('Saved', { id: 'saved' }))!;
    const events = recordEvents(region);

    await toast.hide();

    expect(events).to.deep.equal(['hidden saved']);
    expect(toast.isConnected).to.be.false;
  });

  it('requests to hide on Escape while it has focus, keeping the Escape from what it is in', async () => {
    const region = await regionFixture();
    const toast = (await showToast('Saved', { id: 'saved' }))!;
    const events = recordEvents(region);
    let escapeReachedParent = false;
    region.parentElement!.addEventListener('keydown', () => (escapeReachedParent = true));

    toast.focus();
    toast.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await nextFrame();

    expect(events).to.deep.equal(['hide saved', 'hidden saved']);
    expect(escapeReachedParent).to.be.false;
  });
});

describe('<awc-toast> timing', () => {
  it('hides once its duration has passed, emitting only `hidden`', async () => {
    const region = await regionFixture();
    const events = recordEvents(region);

    const toast = (await showToast('Copied', { id: 'copied', duration: 100 }))!;
    await aTimeout(50);
    expect(toast.open).to.be.true;
    await aTimeout(150);

    expect(toast.isConnected).to.be.false;
    expect(events).to.deep.equal(['shown copied', 'hidden copied']);
  });

  it('hides after 5 seconds by default, but keeps a danger toast and one holding an action until dismissed', async () => {
    const region = await regionFixture(
      '',
      toastHtml('id="saved" variant="success"', 'Saved.') +
        toastHtml('id="failed" variant="danger"', 'Couldn’t save.') +
        toastHtml('id="deleted"', 'Event deleted. <button type="button">Undo</button>'),
    );
    const toasts = Array.from(region.querySelectorAll('awc-toast'));
    await Promise.all(toasts.map((toast) => whenInitialized(toast)));

    await aTimeout(4800);
    expect(toasts.map((toast) => toast.isConnected)).to.deep.equal([true, true, true]);
    await aTimeout(500);

    expect(toasts.map((toast) => toast.isConnected)).to.deep.equal([false, true, true]);
  }).timeout(8000);

  it('hides a danger toast given a duration', async () => {
    await regionFixture();

    const toast = (await showToast('Couldn’t save.', { variant: 'danger', duration: 100 }))!;
    await aTimeout(200);

    expect(toast.isConnected).to.be.false;
  });

  it('stays until dismissed with an infinite duration', async () => {
    await regionFixture();

    const toast = (await showToast('Deleting…', { duration: Infinity }))!;
    await aTimeout(200);

    expect(toast.duration).to.equal(Infinity);
    expect(toast.open).to.be.true;
  });
});

/** Makes `document.hidden` read `hidden`, as switching tabs does, and tells the page. */
function setTabHidden(hidden: boolean) {
  if (hidden) {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  } else {
    delete (document as { hidden?: boolean }).hidden;
  }
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('<awc-toast-region> pausing', () => {
  const causes: Array<[string, (region: AwcToastRegionElement) => void, (region: AwcToastRegionElement) => void]> = [
    [
      'the pointer is over the region',
      (region) => region.dispatchEvent(new PointerEvent('pointerenter')),
      (region) => region.dispatchEvent(new PointerEvent('pointerleave')),
    ],
    [
      'focus is in the region',
      (region) => region.querySelector<HTMLElement>('awc-toast')!.focus(),
      () => (document.activeElement as HTMLElement).blur(),
    ],
    ['the window has lost focus', () => window.dispatchEvent(new Event('blur')), () => window.dispatchEvent(new Event('focus'))],
    ['the tab is hidden', () => setTabHidden(true), () => setTabHidden(false)],
  ];

  for (const [cause, pause, resume] of causes) {
    it(`pauses every toast while ${cause}, then carries on with the time left`, async () => {
      const region = await regionFixture();
      const first = (await showToast('Saved', { duration: 300 }))!;
      const second = (await showToast('Copied', { duration: 300 }))!;
      await aTimeout(100);

      pause(region);
      await aTimeout(400);
      expect([first.open, second.open]).to.deep.equal([true, true]);

      resume(region);
      await aTimeout(100);
      expect([first.open, second.open]).to.deep.equal([true, true]);
      await aTimeout(250);
      expect([first.isConnected, second.isConnected]).to.deep.equal([false, false]);
    });
  }
});

/** Waits for the announcers, which take a toast's text two frames after it shows, so that it is heard as a change. */
async function announced() {
  await nextFrame();
  await nextFrame();
  await nextFrame();
}

function announcers(region: AwcToastRegionElement) {
  const polite = region.querySelector('[aria-live="polite"]')!;
  const assertive = region.querySelector('[aria-live="assertive"]')!;
  return () => [polite.textContent, assertive.textContent];
}

describe('<awc-toast-region> announcements', () => {
  it('announces a toast politely, and a danger toast assertively', async () => {
    const region = await regionFixture();
    const heard = announcers(region);

    await showToast('Saved');
    await announced();
    expect(heard()).to.deep.equal(['Saved', '']);

    await showToast('Couldn’t save', { variant: 'danger' });
    await announced();
    expect(heard()).to.deep.equal(['Saved', 'Couldn’t save']);
  });

  it('announces a toast’s title before its message', async () => {
    const container = await fixture<HTMLDivElement>('<div></div>');
    container.innerHTML = regionHtml('', toastHtml('variant="warning"', 'We kept a copy of your work.', 'You’re offline'));
    const region = container.querySelector('awc-toast-region')!;
    await whenInitialized(region.querySelector('awc-toast')!);
    await announced();

    expect(announcers(region)()).to.deep.equal(['You’re offline. We kept a copy of your work.', '']);
  });

  it('empties the announcer once the toast has been heard, so that nothing is left to repeat', async () => {
    const region = await regionFixture();

    await showToast('Saved');
    await aTimeout(1200);

    expect(announcers(region)()).to.deep.equal(['', '']);
  });
});

/** Presses `key` on whatever has focus, as a keyboard does. */
function press(key: string) {
  const target = document.activeElement ?? document.body;
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('<awc-toast-region> keyboard', () => {
  async function setup(attributes = '') {
    const container = await fixture<HTMLDivElement>(`<div><button type="button" id="save">Save</button>${regionHtml(attributes)}</div>`);
    const region = container.querySelector('awc-toast-region')!;
    await whenInitialized(region);
    const button = container.querySelector<HTMLButtonElement>('#save')!;
    const older = (await showToast('Saved', { id: 'older', duration: Infinity }))!;
    const newer = (await showToast('Copied', { id: 'newer', duration: Infinity }))!;
    button.focus();
    return { region, button, older, newer };
  }

  it('moves focus to the newest toast on F8, and back to where it was on F8 again', async () => {
    const { button, newer } = await setup();

    press('F8');
    expect(document.activeElement === newer).to.be.true;

    press('F8');
    expect(document.activeElement === button).to.be.true;
  });

  it('takes its hotkey from `hotkey`, and has none when it is empty', async () => {
    const { region, button, newer } = await setup('hotkey="F9"');

    press('F8');
    expect(document.activeElement === button).to.be.true;
    press('F9');
    expect(document.activeElement === newer).to.be.true;

    press('F9');
    region.hotkey = '';
    press('F9');
    expect(document.activeElement === button).to.be.true;
  });

  it('moves focus to the next toast when the focused one hides, and back to where it was after the last', async () => {
    const { region, button, older } = await setup();

    press('F8');
    press('Escape');
    await nextFrame();
    expect(document.activeElement === older).to.be.true;

    press('Escape');
    await nextFrame();
    expect(document.activeElement === button).to.be.true;
    expect(region.paused).to.be.false;
  });

  it('returns focus to where it came from when a toast tabbed into hides', async () => {
    const { region, button, older } = await setup();

    // As Tab does, from the button to the close button of a toast.
    older.querySelector<HTMLButtonElement>('.awc-toast-close-btn')!.focus();
    await older.hide();

    expect(document.activeElement === region.querySelector('#newer')).to.be.true;
    await (region.querySelector('#newer') as AwcToastElement).hide();
    expect(document.activeElement === button).to.be.true;
  });
});

/** Mirrors `app/components/impulse/dialog_component.html.erb`: the parts `<awc-dialog>` reads. */
function dialogHtml(body = '') {
  return `
    <awc-dialog>
      <dialog
        data-target="awc-dialog.dialog"
        data-action="click->awc-dialog#handleClick keydown->awc-dialog#handleKeydown cancel->awc-dialog#handleCancel close->awc-dialog#handleClose"
      >
        <p>Share goal</p>
        ${body}
      </dialog>
    </awc-dialog>
  `;
}

/** Whether a press at the centre of `element` lands on it: false while a modal dialog leaves it inert. */
function pressable(element: Element) {
  const rect = element.getBoundingClientRect();
  const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  return !!hit && element.contains(hit);
}

/** Waits for the region to hear a dialog open or close, and to move. */
async function moved() {
  await nextFrame();
  await nextFrame();
}

describe('<awc-toast-region> over modal dialogs', () => {
  async function setup() {
    const container = await fixture<HTMLDivElement>(`<div>${dialogHtml()}${regionHtml()}</div>`);
    const region = container.querySelector('awc-toast-region')!;
    const dialog = container.querySelector('awc-dialog')!;
    await whenInitialized(region);
    await whenInitialized(dialog);
    return { container, region, dialog };
  }

  it('moves into a modal dialog as it opens, where its toasts can be pressed, and back out as it closes', async () => {
    const { container, region, dialog } = await setup();
    const toast = (await showToast('Copied', { id: 'copied', duration: Infinity }))!;
    const events = recordEvents(container);

    dialog.show();
    await moved();
    expect(region.parentElement === dialog.dialog).to.be.true;
    expect(region.matches(':popover-open')).to.be.true;
    expect(pressable(toast.querySelector('.awc-toast-close-btn')!)).to.be.true;

    await dialog.hide();
    await moved();
    expect(region.parentElement === container).to.be.true;
    expect(region.matches(':popover-open')).to.be.true;
    expect(pressable(toast.querySelector('.awc-toast-close-btn')!)).to.be.true;
    expect(events.filter((event) => event.endsWith('copied'))).to.deep.equal([]);
  });

  it('shows a toast inside a modal dialog already open', async () => {
    const { region, dialog } = await setup();
    dialog.dialog.showModal();

    const toast = (await showToast('Copied', { duration: Infinity }))!;

    expect(region.parentElement === dialog.dialog).to.be.true;
    expect(pressable(toast.querySelector('.awc-toast-close-btn')!)).to.be.true;
    dialog.dialog.close();
  });

  it('keeps its toasts’ timers going as it moves', async () => {
    const { dialog } = await setup();
    const toast = (await showToast('Copied', { duration: 400 }))!;
    await aTimeout(200);

    dialog.show();
    await aTimeout(300);

    expect(toast.isConnected).to.be.false;
    await dialog.hide();
  });
});

describe('defaults', () => {
  it('keeps the region’s defaults through a morph to markup without them', async () => {
    const region = await regionFixture();

    Idiomorph.morph(region, regionHtml());

    expect([region.hotkey, region.placement]).to.deep.equal(['F8', 'top-center']);
  });

  it('falls back to the region’s defaults when a morph removes their attributes', async () => {
    const region = await regionFixture('hotkey="F9" placement="bottom-end"');

    Idiomorph.morph(region, regionHtml());

    expect([region.hotkey, region.placement]).to.deep.equal(['F8', 'top-center']);
  });

  it('falls back to the toast’s defaults when a morph removes their attributes', async () => {
    const region = await regionFixture('', toastHtml('id="saved" variant="success" duration="Infinity"', 'Saved.'));
    const toast = region.querySelector('awc-toast')!;
    await whenInitialized(toast);

    Idiomorph.morph(toast, toastHtml('id="saved" open', 'Saved.'));

    expect([toast.variant, toast.duration]).to.deep.equal(['info', 5000]);
  });
});

/** Gives leaving toasts a fade, as the stylesheet does, so that a hide takes `ms` to finish. */
async function withLeavingTransition(ms: number) {
  return fixture<HTMLStyleElement>(`<style>.awc-toast--leaving { opacity: 0; transition: opacity ${ms}ms linear; }</style>`);
}

describe('regressions', () => {
  it('emits only `hidden` when `open` is removed', async () => {
    const region = await regionFixture();
    const toast = (await showToast('Saved', { id: 'saved' }))!;
    const events = recordEvents(region);

    toast.open = false;
    await nextFrame();

    expect(events).to.deep.equal(['hidden saved']);
    expect(toast.isConnected).to.be.false;
  });

  it('doesn’t show a hiding toast again when it moves with its region', async () => {
    await withLeavingTransition(300);
    const container = await fixture<HTMLDivElement>(`<div>${dialogHtml()}${regionHtml()}</div>`);
    const dialog = container.querySelector('awc-dialog')!;
    await whenInitialized(container.querySelector('awc-toast-region')!);
    await whenInitialized(dialog);
    const toast = (await showToast('Saved', { id: 'saved', duration: Infinity }))!;
    const events = recordEvents(container);

    closeButton(toast).click();
    dialog.show();
    await aTimeout(400);

    expect(events).to.deep.equal(['hide saved', 'hidden saved']);
    expect(toast.isConnected).to.be.false;
    await dialog.hide();
  });

  it('follows the dialog opened last, wherever it is in the page', async () => {
    const container = await fixture<HTMLDivElement>(`<div>${dialogHtml()}${dialogHtml()}${regionHtml()}</div>`);
    const [first, second] = Array.from(container.querySelectorAll('awc-dialog'));
    const region = container.querySelector('awc-toast-region')!;
    await Promise.all([region, first, second].map((element) => whenInitialized(element)));
    const toast = (await showToast('Copied', { duration: Infinity }))!;

    second.show();
    await moved();
    first.show();
    await moved();

    expect(region.parentElement === first.dialog).to.be.true;
    expect(pressable(toast.querySelector('.awc-toast-close-btn')!)).to.be.true;
    await first.hide();
    await moved();
    expect(region.parentElement === second.dialog).to.be.true;
    await second.hide();
  });

  it('announces every toast shown at once', async () => {
    const region = await regionFixture();

    await showToast('Goal created.');
    await showToast('Parents emailed.');
    await announced();

    expect(region.querySelector('[aria-live="polite"]')!.textContent).to.include('Goal created.');
    expect(region.querySelector('[aria-live="polite"]')!.textContent).to.include('Parents emailed.');
  });

  it('carries on with the timers when a focused toast is removed', async () => {
    const region = await regionFixture();
    const toast = (await showToast('Saved', { duration: Infinity }))!;
    toast.focus();
    expect(region.paused).to.be.true;

    toast.remove();
    await nextFrame();

    expect(region.paused).to.be.false;
  });

  it('drops its toasts when the browser restores the page from its back-forward cache', async () => {
    const region = await regionFixture();
    await showToast('Couldn’t save', { variant: 'danger' });
    const events = recordEvents(region);

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));

    expect(region.toasts.length).to.equal(0);
    expect(events).to.deep.equal([]);
  });

  it('drops a toast copied from a cached page while it was leaving', async () => {
    const container = await fixture<HTMLDivElement>('<div></div>');
    const events = recordEvents(container);

    const leaving = toastHtml('id="saved"', 'Saved.').replace('class="awc-toast"', 'class="awc-toast awc-toast--leaving"');
    container.innerHTML = regionHtml('', leaving);
    await whenInitialized(container.querySelector('awc-toast-region')!);
    await nextFrame();

    expect(container.querySelectorAll('awc-toast').length).to.equal(0);
    expect(events).to.deep.equal([]);
  });
});
