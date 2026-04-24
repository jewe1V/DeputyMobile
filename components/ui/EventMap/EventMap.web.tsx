import React from 'react';
import { View, StyleSheet } from 'react-native';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

interface EventMapProps {
    coordinates: { lat: number; lon: number };
}

export const EventMap: React.FC<EventMapProps> = ({ coordinates }) => {
    const mapState = {
        center: [coordinates.lat, coordinates.lon],
        zoom: 14,
        controls: [],
    };

    return (
        <View style={styles.container}>
            <YMaps query={{ apikey: process.env.EXPO_PUBLIC_GEOCODER_API_KEY }}>
                <Map
                    defaultState={mapState}
                    width="100%"
                    height="100%"
                    options={{
                        suppressMapOpenBlock: true,
                    }}
                >
                    <Placemark
                        geometry={[coordinates.lat, coordinates.lon]}
                        options={{
                            preset: 'islands#redDotIcon',
                        }}
                    />
                </Map>
            </YMaps>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f1f5f9',
        overflow: 'hidden', // Чтобы карта не вылезала за скругления, если они есть
    }
});
