// EventMap.web.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EventMapProps {
    coordinates: { lat: number; lon: number };
}

export const EventMap: React.FC<EventMapProps> = ({ coordinates }) => {
    return (
        <View style={styles.webMap}>
            <Ionicons name="map-outline" size={48} color="#94a3b8" />
            <Text style={styles.webText}>Открыть карту в браузере</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    webMap: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center'
    },
    webText: {
        color: '#64748b',
        marginTop: 8,
        fontWeight: '500'
    }
});
