import FeedView from './feed-view';
import FeedModel from './feed-model';

class FeedController {
  constructor() {
    const instance = this.constructor.instance;
    if (instance) {
      return instance;
    }
    this.model = new FeedModel();
    this.view = new FeedView(this);
    this.init();
  }

  init() {
    this.fetchData();

    // IndexedDB then Network
    if ('indexedDB' in window) {
      // eslint-disable-next-line
      readAllData('posts').then((data) => {
        if (!this.model.networkDataReceived) {
          console.log('From cache', data);
          this.view.updateUI(data);
        }
      });
    }
  }

  fetchData() {
    fetch(
      'https://learn-pwa-dc1c0-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json',
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        this.model.networkDataReceived = true;
        console.log('From web', data);
        const dataArray = [];
        // eslint-disable-next-line
        for (const key in data) {
          const fbObj = { ...data[key] };
          fbObj.fbId = key;
          dataArray.push(fbObj);
        }
        this.view.updateUI(dataArray);
      });
  }

  deleteData(fbId) {
    fetch(
      'https://us-central1-learn-pwa-dc1c0.cloudfunctions.net/deletePostData',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({ fbId }),
      },
    ).then((res) => {
      console.log(res);
    });
  }

  sendData(titleInput, locationInput) {
    const id = new Date().toISOString();
    const postData = new FormData();
    postData.append('id', id);
    postData.append('title', titleInput.value);
    postData.append('location', locationInput.value);
    postData.append('rawLocationLat', this.model.fetchedLocation.lat);
    postData.append('rawLocationLng', this.model.fetchedLocation.lng);
    postData.append('file', this.model.picture, `${id}.png`);

    fetch(
      'https://us-central1-learn-pwa-dc1c0.cloudfunctions.net/storePostData',
      {
        method: 'POST',
        body: postData,
      },
    )
      .then((res) => {
        console.log('Sent data', res);
        return res.json();
      })
      .then((data) => {
        const dataArray = [];
        // eslint-disable-next-line
        for (const key in data) {
          const fbObj = { ...data[key] };
          fbObj.fbId = key;
          dataArray.push(fbObj);
        }
        this.view.updateUI(dataArray);
      });
  }

  handleFormSubmit(titleInput, locationInput) {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((sw) => {
        const post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture: this.model.picture,
          rawLocation: this.model.fetchedLocation,
        };
        // eslint-disable-next-line
        writeData('sync-posts', post)
          .then(() => {
            return sw.sync.register('sync-new-posts');
          })
          .then(() => {
            const snackbarContainer = document.querySelector(
              '#confirmation-toast',
            );
            const data = { message: 'Your Post was saved for syncing!' };
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch((err) => {
            console.log(err);
          });
      });
    } else {
      this.sendData(titleInput, locationInput);
    }
  }
}

export default function feedInstance() {
  return new FeedController();
}
