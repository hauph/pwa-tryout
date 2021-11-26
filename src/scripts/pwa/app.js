class App {
  constructor() {
    const instance = this.constructor.instance;
    if (instance) {
      return instance;
    }
    this.constructor.instance = this;
    this.counter = 0;

    this.init();
  }

  init() {
    this.registerSW();
  }

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service worker registered!');
      });
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      if (!this.counter) {
        console.log('beforeinstallprompt fired');
        event.preventDefault();
        window.deferredPrompt = event;
      }
      this.counter++;
      return false;
    });
  }
}

export function appInstance() {
  return new App();
}
