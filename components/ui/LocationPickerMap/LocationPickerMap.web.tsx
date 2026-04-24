import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

export const LocationPickerMap = forwardRef<any, any>((props, ref) => {
    // На вебе ref не будет иметь методов setCenter,
    // поэтому в основном компоненте добавим проверки.
    return (
        <View style={styles.webPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#ccc" />
            <Text style={styles.webText}>
                Интерактивная карта доступна только в мобильном приложении.
            </Text>
            {props.coords && (
                <Text style={styles.coordsText}>
                    Координаты: {props.coords.lat.toFixed(4)}, {props.coords.lon.toFixed(4)}
                </Text>
            )}
            <Text style={styles.hint}>Используйте поиск сверху для выбора адреса</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    webPlaceholder: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    webText: { color: '#64748b', fontSize: 16, textAlign: 'center', marginTop: 12 },
    coordsText: { color: '#0f6319', fontWeight: 'bold', marginTop: 8 },
    hint: { color: '#94a3b8', fontSize: 13, marginTop: 12 }
});
