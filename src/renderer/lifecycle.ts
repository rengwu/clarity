const pendingDocuments = new Map<string, () => Promise<void>>();
export function registerDocument(path: string, save: () => Promise<void>) {
  pendingDocuments.set(path, save);
  return () => {
    if (pendingDocuments.get(path) === save) pendingDocuments.delete(path);
  };
}
export async function flushDocument(path: string) {
  await pendingDocuments.get(path)?.();
}
export async function flushDocuments() {
  await Promise.all([...pendingDocuments.values()].map((save) => save()));
}
declare global {
  interface Window {
    prepareClarityQuit: () => Promise<void>;
  }
}
window.prepareClarityQuit = flushDocuments;
