import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

interface MapProps {
    hasPermission: boolean;
    initialRegion: any;
    coords: { lat: number; lon: number } | null;
    onMapPress: (e: any) => void;
    onCameraPositionChange: (e: any) => void;
}

export const LocationPickerMap = forwardRef<any, MapProps>((props, ref) => {
    const mapRef = useRef<any>(null);

    // Экспортируем метод setCenter, чтобы модалка могла управлять картой
    useImperativeHandle(ref, () => ({
        setCenter: (coords: { lat: number; lon: number }, zoom: number = 16) => {
            if (mapRef.current) {
                // В веб-версии Яндекса координаты передаются как [lat, lon]
                mapRef.current.setCenter([coords.lat, coords.lon], zoom, {
                    checkZoomRange: true,
                    duration: 300, // Плавная анимация, как на мобилке
                });
            }
        }
    }));

    // Обработка клика по карте
    const handleMapClick = (e: any) => {
        const coords = e.get('coords'); // Возвращает массив [lat, lon]
        if (props.onMapPress) {
            props.onMapPress({
                nativeEvent: {
                    lat: coords[0],
                    lon: coords[1],
                }
            });
        }
    };

    // Обработка перемещения/зума камеры (для синхронизации стейта в модалке)
    const handleBoundsChange = () => {
        if (props.onCameraPositionChange && mapRef.current) {
            const center = mapRef.current.getCenter();
            const zoom = mapRef.current.getZoom();
            props.onCameraPositionChange({
                nativeEvent: {
                    point: { lat: center[0], lon: center[1] },
                    zoom: zoom
                }
            });
        }
    };

    // Начальное состояние карты
    const defaultState = {
        center: props.initialRegion
            ? [props.initialRegion.lat, props.initialRegion.lon]
            : [56.837239, 60.597887], // Екатеринбург по умолчанию
        zoom: props.initialRegion?.zoom || 16,
    };

    return (
        <View style={styles.mapContainer}>
            <YMaps query={{ apikey: process.env.EXPO_PUBLIC_GEOCODER_API_KEY }}>
                <Map
                    instanceRef={mapRef}
                    defaultState={defaultState}
                    width="100%"
                    height="100%"
                    options={{
                        suppressMapOpenBlock: true,
                        yandexMapDisablePoiInteractivity: true
                    }}
                    onClick={handleMapClick}
                    onBoundsChange={handleBoundsChange}
                >
                    {props.coords && (
                        <Placemark
                            geometry={[props.coords.lat, props.coords.lon]}
                            options={{
                                preset: 'islands#darkGreenDotIcon',
                            }}
                        />
                    )}
                </Map>
            </YMaps>
        </View>
    );
});

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    }
});
