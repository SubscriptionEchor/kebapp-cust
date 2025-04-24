export const ConfigurableValues = () => {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://del-qa-api.kebapp-chefs.com/";
    const OSM_SEARCH_URL = import.meta.env.VITE_OSM_URL || "https://maps.kebapp-chefs.com:444/";
    const TILE_URL = import.meta.env.VITE_TILE_URL ? `${import.meta.env.VITE_TILE_URL}styles/basic-preview/512/{z}/{x}/{y}.png` : "https://maps.kebapp-chefs.com/styles/basic-preview/512/{z}/{x}/{y}.png";

    return {
        SERVER_URL,
        OSM_SEARCH_URL,
        TILE_URL
    }
}