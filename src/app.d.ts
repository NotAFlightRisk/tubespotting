declare global {
  namespace App {
    interface Platform {
      ctx?: { waitUntil(work: Promise<unknown>): void };
    }
  }
}

export {};
