/* eslint-disable consistent-return */
const enableNotificationsButtons = document.querySelectorAll(
  '.enable-notifications',
);
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
    if ('Notification' in window && 'serviceWorker' in navigator) {
      this.askForNotificationPermission();
    }
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

  configurePushSub() {
    let reg;

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
          swreg
            .showNotification('Successfully subscribed', options)
            .then(() => {
              for (let i = 0; i < enableNotificationsButtons.length; i++) {
                enableNotificationsButtons[i].style.display = 'none';
              }
            });
        });
      }
    }

    function subscribePushNotification(
      shouldDisplayConfirmNotification = false,
    ) {
      const vapidPublicKey =
        'BOmdE_7-5xIui2gOettwQwJ5HEbbZ0dwvImwIjX4VQ83c-zkx5j4ewPDACzgM81ryrRkbnUrlggr6BA51vsM8e8';
      // eslint-disable-next-line
      const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
      reg.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
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
          if (res && res.ok && shouldDisplayConfirmNotification) {
            displayConfirmNotification();
          }
        });
    }

    navigator.serviceWorker.ready
      .then((swreg) => {
        reg = swreg;
        return swreg.pushManager.getSubscription();
      })
      .then((sub) => {
        if (sub !== null) {
          for (let i = 0; i < enableNotificationsButtons.length; i++) {
            enableNotificationsButtons[i].style.display = 'none';
          }

          // eslint-disable-next-line
          fetch(`${baseURL()}deleteSubcribeData`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
            .then((res) => {
              if (res && res.ok) {
                sub.unsubscribe().then(() => {
                  console.log('User is unsubscribed.');
                  subscribePushNotification();
                });
              }
            })
            .catch((err) => {
              console.log('deleteSubcribeData >>>', err);
            });
        } else {
          subscribePushNotification(true);
        }
      })
      .catch((err) => {
        console.log('configurePushSub >>>', err);
      });
  }

  askForNotificationPermission() {
    Notification.requestPermission((result) => {
      console.log('User Choice', result);
      switch (result) {
        case 'granted':
          this.configurePushSub();
          break;
        case 'denied':
          for (let i = 0; i < enableNotificationsButtons.length; i++) {
            enableNotificationsButtons[i].style.display = 'none';
          }
          break;
        default:
          console.log('Notification is default');
          break;
      }
    });
  }

  initNotification() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      for (let i = 0; i < enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = 'inline-block';
        enableNotificationsButtons[i].addEventListener('click', () => {
          this.askForNotificationPermission();
        });
      }
    }
  }
}

export default function appInstance() {
  return new App();
}
