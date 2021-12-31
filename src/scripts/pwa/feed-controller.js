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
    this.reloadData();

    // IndexedDB then Network
    if ('indexedDB' in window) {
      // eslint-disable-next-line
      readAllData('posts').then((data) => {
        if (!this.model.networkDataReceived) {
          console.log('From cache', data);
          this.model.updateData(data);
          this.view.updateUI(data);
        }
      });
    }
  }

  reloadData() {
    const _this = this;
    setInterval(async () => {
      // eslint-disable-next-line
      const data = await readAllData('reload');
      if (data.length) {
        _this.fetchData();
        // eslint-disable-next-line
        clearAllData('reload');
      }
    }, 1000);
  }

  fetchData() {
    // eslint-disable-next-line
    fetch(`${baseURL()}fetchPostData`)
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
        this.model.updateData(dataArray);
        this.view.updateUI(dataArray);
      });
  }

  async deleteData(fbId) {
    const promise = (() => {
      return new Promise((resolve, reject) => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then((sw) => {
            // eslint-disable-next-line
            writeData('sync-deleted-posts', {
              fbId,
            })
              .then(() => {
                return sw.sync.register('deleted-posts');
              })
              .then(() => {
                const snackbarContainer = document.querySelector(
                  '#confirmation-toast',
                );
                const data = {
                  message: 'Your post was saved for deleting!',
                };
                snackbarContainer.MaterialSnackbar.showSnackbar(data);
                resolve(true);
              })
              .catch((err) => {
                console.log('deleteData > sync-deleted-posts >>>', err);
                reject(err);
              });
          });
        } else {
          // eslint-disable-next-line
          fetch(`${baseURL()}deletePostData`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fbId }),
          })
            .then((res) => {
              resolve(true);
            })
            .catch((err) => {
              console.log('deleteData >>>', err);
              reject(err);
            });
        }
      });
    })();

    try {
      const result = await promise;
      if (result) {
        const { data } = this.model;
        const element = document.getElementById(fbId);
        if (element) {
          element.remove();
          const newData = data.filter((dt) => dt.fbId !== fbId);
          this.model.updateData(newData);
        }
      }
    } catch (error) {
      console.log('promise error >>>', error);
    }
  }

  sendData(title, location) {
    const id = new Date().toISOString();
    const postData = new FormData();
    postData.append('id', id);
    postData.append('title', title);
    postData.append('location', location);
    postData.append('rawLocationLat', this.model.fetchedLocation.lat);
    postData.append('rawLocationLng', this.model.fetchedLocation.lng);
    postData.append('file', this.model.picture, `${id}.png`);

    // eslint-disable-next-line
    fetch(`${baseURL()}storePostData`, {
      method: 'POST',
      body: postData,
    })
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
        this.model.updateData(dataArray);
        this.view.updateUI(dataArray);
      });
  }

  handleFormSubmit(title, location) {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((sw) => {
        const post = {
          id: new Date().toISOString(),
          picture: this.model.picture,
          rawLocation: this.model.fetchedLocation,
          title,
          location,
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
            const data = { message: 'Your post was saved for syncing!' };
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch((err) => {
            console.log(err);
          });
      });
    } else {
      this.sendData(title, location);
    }
  }

  handlePrevNext(type, id) {
    const { data } = this.model;
    let index = data.findIndex((dt) => dt.fbId === id);
    switch (type) {
      case 'prev':
        index = index - 1 === -1 ? data.length - 1 : index - 1;
        break;
      default:
        index = index + 1 === data.length ? 0 : index + 1;
        break;
    }
    const newPost = data[index];
    this.view.toggleImgModal(newPost);
  }
}

export default function feedInstance() {
  return new FeedController();
}
