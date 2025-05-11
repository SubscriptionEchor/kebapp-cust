  export const onClickViewDirections = (temporaryLocation,location) => {
    let cords = {
      user_lat: Number(temporaryLocation?.latitude),
      user_lng: Number(temporaryLocation?.longitude),
      rest_lat: Number(location?.coordinates[1]),
      rest_lng: Number(location?.coordinates[0])
    }
    let url = `https://www.google.com/maps/dir/?api=1&origin=${cords?.user_lat},${cords?.user_lng}&destination=${cords?.rest_lat},${cords?.rest_lng}`
    if (window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.openLink(url, { try_instant_view: false });
    } else {
      window.open(url, '_blank');
    }
  }