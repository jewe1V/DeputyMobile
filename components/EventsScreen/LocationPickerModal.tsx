import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    Modal, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Yamap, Marker } from 'react-native-yamap-plus';
import * as Location from 'expo-location';

const INITIAL_REGION = {
    lat: 56.837239,
    lon: 60.597887,
    zoom: 16,
};

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onLocationSelected: (location: { address: string; coords: { lat: number; lon: number } }) => void;
    initialLocation?: string;
    initialCoords?: { lat: number; lon: number } | null;
}

export default function LocationPickerModal({
                                                visible,
                                                onClose,
                                                onLocationSelected,
                                                initialLocation,
                                                initialCoords
                                            }: LocationPickerModalProps) {
    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [location, setLocation] = useState("");
    const [mapZoom, setMapZoom] = useState(INITIAL_REGION.zoom);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const mapRef = useRef<any>(null);
    const insets = useSafeAreaInsets();
    // @ts-ignore
    const searchTimeout = useRef<NodeJS.Timeout>();

    // Сброс состояния при открытии модалки
    useEffect(() => {
        if (visible) {
            if (initialCoords) {
                setCoords(initialCoords);
                setLocation(initialLocation || "");
            } else {
                const defaultCoords = { lat: INITIAL_REGION.lat, lon: INITIAL_REGION.lon };
                setCoords(defaultCoords);
                reverseGeocode(defaultCoords);
            }
            setMapZoom(INITIAL_REGION.zoom);
        } else {
            // Очистка при закрытии
            setSearchQuery("");
            setSearchResults([]);
            setCoords(null);
        }
    }, [visible]);

    // Центрирование карты с debounce
    useEffect(() => {
        if (!visible || !mapRef.current || !coords) return;

        const timer = setTimeout(() => {
            if (mapRef.current && coords) {
                try {
                    mapRef.current.setCenter(coords, mapZoom);
                } catch (error) {
                    console.error('Error centering map:', error);
                }
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [visible, coords, mapZoom]);

    const reverseGeocode = async (coords: { lat: number; lon: number }) => {
        if (!coords) return;

        try {
            const [address] = await Location.reverseGeocodeAsync({
                latitude: coords.lat,
                longitude: coords.lon
            });

            if (address) {
                const parts = [];
                if (address.city) parts.push(address.city);
                else if (address.region) parts.push(address.region);
                if (address.street) parts.push(address.street);
                if (address.name && address.name !== address.street) parts.push(address.name);

                const formatted = parts.filter(Boolean).join(', ');
                setLocation(formatted || "Выбранное место");
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
        }
    };

    const getUserLocation = useCallback(async () => {
        try {
            setIsLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Ошибка", "Нет доступа к геолокации");
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            const newCoords = {
                lat: location.coords.latitude,
                lon: location.coords.longitude
            };

            setCoords(newCoords);
            await reverseGeocode(newCoords);

            // Обновляем центр карты
            if (mapRef.current) {
                setTimeout(() => {
                    if (mapRef.current) {
                        mapRef.current.setCenter(newCoords, mapZoom);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Get user location error:', error);
            Alert.alert("Ошибка", "Не удалось получить местоположение");
        } finally {
            setIsLoading(false);
        }
    }, [mapZoom]);

    const searchPlaces = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://geocode-maps.yandex.ru/1.x/?apikey=ВАШ_КЛЮЧ_API&geocode=${encodeURIComponent(query)}&format=json&results=10`
            );
            const data = await response.json();

            const results = data.response.GeoObjectCollection.featureMember.map((item: any) => ({
                name: item.GeoObject.name,
                description: item.GeoObject.description,
                lat: parseFloat(item.GeoObject.Point.pos.split(' ')[1]),
                lon: parseFloat(item.GeoObject.Point.pos.split(' ')[0])
            }));

            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // @ts-ignore
        searchTimeout.current = setTimeout(() => {
            searchPlaces(text);
        }, 500);
    }, [searchPlaces]);

    const selectSearchResult = useCallback((result: any) => {
        const newCoords = { lat: result.lat, lon: result.lon };
        setCoords(newCoords);
        setLocation(result.name);
        setSearchQuery(result.name);
        setSearchResults([]);

        const newZoom = 15;
        setMapZoom(newZoom);

        if (mapRef.current) {
            setTimeout(() => {
                if (mapRef.current) {
                    mapRef.current.setCenter(newCoords, newZoom);
                }
            }, 100);
        }
    }, []);

    const handleConfirmLocation = useCallback(async () => {
        if (!coords) return;

        try {
            await reverseGeocode(coords);
            onLocationSelected({ address: location, coords });
            onClose();
        } catch (error) {
            console.error('Confirm location error:', error);
        }
    }, [coords, location, onLocationSelected, onClose]);

    const handleMapPress = useCallback((e: any) => {
        if (!e.nativeEvent) return;

        const { lat, lon } = e.nativeEvent;
        if (typeof lat === 'number' && typeof lon === 'number') {
            setCoords({ lat, lon });
            reverseGeocode({ lat, lon });
        }
    }, []);

    const handleZoomIn = useCallback(() => {
        if (!mapRef.current || !coords) return;

        const newZoom = Math.min(mapZoom + 1, 18);
        setMapZoom(newZoom);

        setTimeout(() => {
            if (mapRef.current && coords) {
                mapRef.current.setCenter(coords, newZoom);
            }
        }, 50);
    }, [mapZoom, coords]);

    const handleZoomOut = useCallback(() => {
        if (!mapRef.current || !coords) return;

        const newZoom = Math.max(mapZoom - 1, 3);
        setMapZoom(newZoom);

        setTimeout(() => {
            if (mapRef.current && coords) {
                mapRef.current.setCenter(coords, newZoom);
            }
        }, 50);
    }, [mapZoom, coords]);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
    }, []);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.mapModalContainer}>
                {/* Верхняя панель с поиском */}
                <View style={[styles.mapHeader, { paddingTop: insets.top + 10 }]}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Поиск места или адреса"
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={clearSearch}>
                                <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                        {isSearching && (
                            <ActivityIndicator size="small" color="#2A6E3F" style={{ marginLeft: 8 }} />
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Результаты поиска */}
                {searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {searchResults.map((result, index) => (
                                <TouchableOpacity
                                    key={`${result.lat}-${result.lon}-${index}`}
                                    style={styles.searchResultItem}
                                    onPress={() => selectSearchResult(result)}
                                >
                                    <Ionicons name="location-outline" size={20} color="#2A6E3F" />
                                    <View style={styles.searchResultTexts}>
                                        <Text style={styles.searchResultName}>{result.name}</Text>
                                        {result.description && (
                                            <Text style={styles.searchResultDescription} numberOfLines={1}>
                                                {result.description}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Карта */}
                <Yamap
                    ref={mapRef}
                    style={styles.map}
                    showUserPosition={true}
                    initialRegion={INITIAL_REGION}
                    onMapPress={handleMapPress}
                    onMapLongPress={handleMapPress}
                >
                    {coords && (
                        <Marker
                            point={{ lat: coords.lat, lon: coords.lon }}
                        >
                            <View style={styles.markerContainer}>
                                <View style={styles.markerDot} />
                            </View>
                        </Marker>
                    )}
                </Yamap>

                {/* Кнопки управления */}
                <View style={styles.zoomControls}>
                    <TouchableOpacity
                        style={styles.zoomButton}
                        onPress={handleZoomIn}
                        activeOpacity={0.7}
                        disabled={!coords}
                    >
                        <Ionicons name="add" size={24} color={coords ? "#333" : "#999"} />
                    </TouchableOpacity>
                    <View style={styles.zoomDivider} />
                    <TouchableOpacity
                        style={styles.zoomButton}
                        onPress={handleZoomOut}
                        activeOpacity={0.7}
                        disabled={!coords}
                    >
                        <Ionicons name="remove" size={24} color={coords ? "#333" : "#999"} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.myLocationButton, isLoading && styles.disabledButton]}
                    onPress={getUserLocation}
                    activeOpacity={0.7}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#333" />
                    ) : (
                        <Ionicons name="locate" size={24} color="#333" />
                    )}
                </TouchableOpacity>

                {/* Нижняя панель */}
                {coords && (
                    <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 10 }]}>
                        <View style={styles.selectedLocationInfo}>
                            <Ionicons name="location" size={20} color="#2A6E3F" />
                            <Text style={styles.selectedLocationText} numberOfLines={2}>
                                {location || "Выберите место на карте"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={handleConfirmLocation}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.confirmBtnText}>Подтвердить</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    mapModalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: 'transparent',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginRight: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        padding: 0,
    },
    closeButton: {
        width: 44,
        height: 44,
        backgroundColor: '#f7f7f7',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResults: {
        position: 'absolute',
        top: 70,
        left: 16,
        right: 16,
        zIndex: 11,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchResultTexts: {
        flex: 1,
        marginLeft: 12,
    },
    searchResultName: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
    },
    searchResultDescription: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#0f6319',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    zoomControls: {
        position: 'absolute',
        right: 16,
        bottom: "55%",
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 20,
    },
    zoomButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomDivider: {
        height: 1,
        backgroundColor: '#ddd',
    },
    myLocationButton: {
        position: 'absolute',
        right: 16,
        bottom: "40%",
        width: 44,
        height: 44,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 20,
    },
    disabledButton: {
        opacity: 0.5,
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
        zIndex: 15,
    },
    selectedLocationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f7f7f7',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginBottom: 16,
    },
    selectedLocationText: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        marginLeft: 8,
    },
    confirmBtn: {
        padding: 16,
        borderRadius: 10,
        backgroundColor: '#0f6319',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0f6319',
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
