export default class FeedModel {
  picture;

  constructor() {
    const instance = this.constructor.instance;
    if (instance) {
      return instance;
    }
    this.data = [];
    this.fetchedLocation = { lat: 0, lng: 0 };
    this.networkDataReceived = false;
  }

  updatePicture(picture) {
    this.picture = picture;
  }

  updateLocation(location) {
    this.fetchedLocation = location;
  }

  updateData(data) {
    this.data = data;
  }
}
