/**
 * A random UUID (version 4), for records the app creates before the server has seen them. It
 * only needs to be unique, not secret, so `Math.random` is enough.
 */
export function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const n = Math.floor(Math.random() * 16);
    // The variant digit is one of 8, 9, a, b
    return (char === 'x' ? n : (n & 0x3) | 0x8).toString(16);
  });
}
