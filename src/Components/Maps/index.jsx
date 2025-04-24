import React, { useState, useEffect } from 'react';
import GoogleMapReact from 'google-map-react';
import { config } from '../../config';
import StoreIcon from "../../assets/svg/storeicon.svg";
import { MAP_TYPES } from '../../constants/enums';
import Loader from '../../Components/Loader/Loader';


const GoogleMaps = (props) => {

    const renderMarkers = ({ map, maps }) => {
        if (!map || !maps) {
            console.warn("Google Maps API has not fully loaded.");
            return;
        }


        const bounds = new maps.LatLngBounds();

        props?.bounds?.forEach((markerData, index) => {
            if (!markerData || !markerData.coords) {
                console.warn('Invalid marker data:', markerData);
                return;
            }
            bounds.extend(new maps.LatLng(markerData.coords.lat, markerData.coords.lng))

            const iconOptions = markerData?.isUser ? null : {
                url: StoreIcon,
                scaledSize: new maps.Size(32, 32),
                origin: new maps.Point(0, 0),
                anchor: new maps.Point(16, 16)
            };

            const marker = new maps.Marker({
                position: { lat: markerData.coords.lat, lng: markerData.coords.lng },
                map,
                title: `Marker ${index + 1}`,
                opacity: props?.type != MAP_TYPES.HOME ? index > 1 ? 0.5 : 1 : 1, //change opacity for icons
                icon: iconOptions
            });

            const infoWindow = new maps.InfoWindow({
                content: `
                    <div style="font-family: Arial, sans-serif; font-size: 14px; max-width: 100px; height: 40px">
                    <p style="padding: 0; margin: 0; font-weight: bold; line-height: 1.2">${markerData?.restaurantInfo?.name}</p>
                    <p style="padding: 0; margin: 0; margin-top: 4px; font-weight: 100; font-size: 12px; line-height: 1.2">${markerData?.restaurantInfo?.address}</p>
                    </div>
                `
            });
            maps.event.addListener(infoWindow, 'domready', () => {
                // Hide all close buttons
                const closeButtons = document.querySelectorAll('.gm-ui-hover-effect');
                closeButtons.forEach(button => {
                    button.style.display = 'none';
                });
            });
            if (props?.type == MAP_TYPES.HOME && !markerData?.isUser) {
                infoWindow.open(map, marker);
            }
            marker.addListener("click", () => props?.handleMapModal(markerData?.restaurantInfo?._id))
            map.fitBounds(bounds, {
                top: 75,
                bottom: 75,
                left: 75,
                right: 75
            });
            // maps.event.addListener("onclick", () => { alert("hi") })
            marker
        });
        if (props?.type == "restaurant" || props?.type == "checkout") {
            const lineSymbol = {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                scale: 2
            };

            new maps.Polyline({
                path: [props?.bounds[0].coords, props?.bounds[1].coords],
                geodesic: true,
                strokeColor: '#000000',
                strokeOpacity: 0,
                icons: [{
                    icon: lineSymbol,
                    offset: '0',
                    repeat: '20px'
                }],
                map: map
            });
        }
    };

    // if(!mapReady){
    //     return <Loader/>
    // }

    return (
        <GoogleMapReact
            style={{ height: props?.height || 400, position: 'relative', width: '100%' }}
            bootstrapURLKeys={{
                key: config.GOOGLE_MAPS_API_KEY,
                libraries: config.libraries,
            }}
            defaultCenter={{
                lat: props?.geometry?.location?.lat || 17.400152251327075,
                lng: props?.geometry?.location?.lng || 78.55534755819755
            }}
            defaultZoom={15}
            options={{
                // clickableIcons: true,
                controlSize: 30,
                disableDoubleClickZoom: false,
                fullscreenControl: false,
                keyboardShortcuts: false,
                zoomControl: false,
            }}
            yesIWantToUseGoogleMapApiInternals
            onGoogleApiLoaded={({ map, maps }) => {
                renderMarkers({ map, maps });
            }}
        />
    );
};


export default GoogleMaps;



