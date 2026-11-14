// The demo app's bundle, which `yarn build:js` writes for Lookbook: every element, and what previews call from their
// inline handlers, as an app calls what it imports.
import { showToast } from '../../../src/elements/toast/index.ts';
import '../../../src/index.ts';

window.showToast = showToast;
