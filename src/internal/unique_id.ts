let globalId = 1000;
/**
 * @description Returns a random string. If you want to use random values please consider the
 * Birthday Problem: https://en.wikipedia.org/wiki/Birthday_problem
 */
export default function uniqueId() {
  return `awc-${globalId++}`;
}
