import React from 'react';
import { StyleSheet } from 'react-native';
import { Yamap, Marker } from 'react-native-yamap-plus';

interface EventMapProps {
    coordinates: { lat: number; lon: number };
}

export const EventMap: React.FC<EventMapProps> = ({ coordinates }) => {
    return (
        <Yamap
            style={styles.map}
            initialRegion={{
                lat: coordinates.lat,
                lon: coordinates.lon,
                zoom: 14,
                azimuth: 0,
                tilt: 0
            }}
            interactiveDisabled={true}
        >
            <Marker point={{ lat: coordinates.lat, lon: coordinates.lon }} />
        </Yamap>
    );
};

const styles = StyleSheet.create({
    map: { width: '100%', height: '100%' }
});
