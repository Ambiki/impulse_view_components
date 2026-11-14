export interface Cancelable {
  clear: () => void;
}

export default function debounce<T extends (...args: any[]) => any>(func: T, wait = 166) {
  let timeout: ReturnType<typeof setTimeout>;
  function debounced(...args: Parameters<T>) {
    const later = () => {
      // @ts-expect-error This
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }

  debounced.clear = () => {
    clearTimeout(timeout);
  };

  return debounced as T & Cancelable;
}
