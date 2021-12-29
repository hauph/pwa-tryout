/* eslint-disable consistent-return */

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
    this.initNotification();
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

  initNotification() {
    const enableNotificationsButtons = document.querySelectorAll(
      '.enable-notifications',
    );

    function displayConfirmNotification() {
      if ('serviceWorker' in navigator) {
        const options = {
          body: 'You successfully subscribed to our Notification service!',
          icon: '/images/icons/app-icon-96x96.png',
          image: '/images/sf-boat.jpg',
          dir: 'ltr',
          lang: 'en-US', // BCP 47,
          vibrate: [100, 50, 200],
          badge: '/images/icons/app-icon-96x96.png',
          tag: 'confirm-notification',
          renotify: true,
          actions: [
            {
              action: 'confirm',
              title: 'Okay',
              icon: '/images/icons/app-icon-96x96.png',
            },
            {
              action: 'cancel',
              title: 'Cancel',
              icon: '/images/icons/app-icon-96x96.png',
            },
          ],
        };

        navigator.serviceWorker.ready.then((swreg) => {
          swreg.showNotification('Successfully subscribed', options);
        });
      }
    }

    function configurePushSub() {
      // if (!('serviceWorker' in navigator)) {
      //   return;
      // }

      let reg;
      navigator.serviceWorker.ready
        .then((swreg) => {
          reg = swreg;
          return swreg.pushManager.getSubscription();
        })
        .then((sub) => {
          if (sub === null) {
            // Create a new subscription
            const vapidPublicKey =
              'BOmdE_7-5xIui2gOettwQwJ5HEbbZ0dwvImwIjX4VQ83c-zkx5j4ewPDACzgM81ryrRkbnUrlggr6BA51vsM8e8';
            const convertedVapidPublicKey =
              // eslint-disable-next-line
              urlBase64ToUint8Array(vapidPublicKey);
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidPublicKey,
            });
          }
          // We have a subscription
        })
        .then((newSub) => {
          if (newSub)
            // eslint-disable-next-line
            return fetch(`${baseURL()}storeSubscriptionData`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({ newSub }),
            });
        })
        .then((res) => {
          if (res && res.ok) {
            displayConfirmNotification();
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }

    function askForNotificationPermission() {
      Notification.requestPermission((result) => {
        console.log('User Choice', result);
        if (result !== 'granted') {
          console.log('No notification permission granted!');
        } else {
          configurePushSub();
        }
      });
    }

    if ('Notification' in window && 'serviceWorker' in navigator) {
      for (let i = 0; i < enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = 'inline-block';
        enableNotificationsButtons[i].addEventListener(
          'click',
          askForNotificationPermission,
        );
      }
    }
  }
}

export default function appInstance() {
  return new App();
}
