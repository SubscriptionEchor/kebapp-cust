
export const metersToKilometers = (meters) => {
    let km = meters / 1000;
    let convertedKm = km.toFixed(1)
    if (convertedKm == km) {
        return km
    }
    return convertedKm
}

export const ratingStructure = (rating) => {
    let convertedRating = rating.toFixed(1)
    if (convertedRating == rating) {
        return rating
    }
    return convertedRating
}

export function numberToK(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(3).replace(/\.0+$/, '') + 'M';
    }
    if (num >= 1000) {
        const newValue = (num / 1000).toFixed(2);
        num = newValue != (num / 1000).toFixed(0) ? newValue : (num / 1000).toFixed(0);
        return num.replace(/\.0+$/, '') + 'k';
    }
    return num?.toString();
}