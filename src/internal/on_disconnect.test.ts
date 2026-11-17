import { ImpulseElement, registerElement } from '@ambiki/impulse';
import { fixture, whenSettled } from '@ambiki/impulse/testing';
import onDisconnect from './on_disconnect';

/**
 * Registers a cleanup every time it connects, the way a hook called from `connected()` does, and records what runs.
 */
@registerElement('on-disconnect-host')
class OnDisconnectHost extends ImpulseElement {
  log: string[] = [];
  private connections = 0;

  connected() {
    this.connections += 1;
    const connection = this.connections;
    onDisconnect(this, () => this.log.push(`cleanup ${connection}`));
  }

  disconnected() {
    this.log.push('disconnected');
  }
}

/** A host inside a container that has a `<section>` to move it into. */
async function hostFixture() {
  const container = await fixture<HTMLElement>(`<div><on-disconnect-host></on-disconnect-host><section></section></div>`);
  const host = container.querySelector<OnDisconnectHost>('on-disconnect-host')!;
  return { container, host, section: container.querySelector('section')! };
}

/** Moves `host` into `destination`, and waits for it to connect there. */
async function move(host: OnDisconnectHost, destination: HTMLElement) {
  destination.append(host);
  await whenSettled();
}

describe('onDisconnect', () => {
  it('runs each cleanup once, on the disconnect that follows it, however often the element moves', async () => {
    const { container, host, section } = await hostFixture();

    await move(host, section);
    await move(host, container);
    host.remove();

    expect(host.log).to.eql([
      'cleanup 1',
      'disconnected',
      'cleanup 2',
      'disconnected',
      'cleanup 3',
      'disconnected',
    ]);
  });

  it('runs the cleanups registered during one connection newest first', async () => {
    const { host } = await hostFixture();
    onDisconnect(host, () => host.log.push('second'));
    onDisconnect(host, () => host.log.push('third'));

    host.remove();

    expect(host.log).to.eql(['third', 'second', 'cleanup 1', 'disconnected']);
  });
});
