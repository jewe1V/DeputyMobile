import React, { useState, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Yamap,  Marker } from 'react-native-yamap-plus';
import * as Location from 'expo-location';
import { router } from "expo-router";
import {apiUrl} from "@/api/api";
import { AuthTokenManager } from "@/components/LoginScreen/LoginScreen";

const INITIAL_REGION = {
    lat: 56.837239,
    lon: 60.597887,
    zoom: 16,
};

export default function CreateEventScreen() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [isMapModalVisible, setMapModalVisible] = useState(false);
    const [mapZoom, setMapZoom] = useState(12);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const mapRef = useRef<any>(null);

    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Ошибка", "Нет доступа к геолокации");
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const newCoords = {
                lat: location.coords.latitude,
                lon: location.coords.longitude
            };
            setCoords(newCoords);

            if (mapRef.current) {
                mapRef.current.setCenter(newCoords, mapZoom);
            }

            await reverseGeocode(newCoords);
        } catch (error) {
            console.error(error);
        }
    };

    const reverseGeocode = async (coords: { lat: number; lon: number }) => {
        try {
            const [address] = await Location.reverseGeocodeAsync({
                latitude: coords.lat,
                longitude: coords.lon
            });

            if (address) {
                // Собираем адрес по частям
                const parts = [];

                // Город или регион
                if (address.city) {
                    parts.push(address.city);
                } else if (address.region) {
                    parts.push(address.region);
                }

                // Улица
                if (address.street) {
                    parts.push(address.street);
                }

                // Номер дома
                if (address.name && address.name !== address.street) {
                    parts.push(address.name);
                }

                // Формируем итоговую строку
                const formatted = parts.filter(p => p && p.trim()).join(', ');
                setLocation(formatted || "Выбранное место");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Поиск мест
    const searchPlaces = async (query: string) => {
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
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    // Выбор места из поиска
    const selectSearchResult = (result: any) => {
        const newCoords = { lat: result.lat, lon: result.lon };
        setCoords(newCoords);
        setLocation(result.name);
        setSearchQuery(result.name);
        setSearchResults([]);

        if (mapRef.current) {
            mapRef.current.setCenter(newCoords, 15);
        }
    };

    // Обработка подтверждения места
    const handleConfirmLocation = async () => {
        if (!coords) return;

        await reverseGeocode(coords);
        setMapModalVisible(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    // Обработка нажатия на карту
    const handleMapPress = (e: any) => {
        const { lat, lon } = e.nativeEvent;
        setCoords({ lat, lon });
        reverseGeocode({ lat, lon });
    };

    // Изменение зума
    const handleZoomIn = () => {
        if (mapRef.current && coords) {
            const newZoom = Math.min(mapZoom + 1, 18);
            setMapZoom(newZoom);
            mapRef.current.setCenter(coords, newZoom);
        }
    };

    const handleZoomOut = () => {
        if (mapRef.current && coords) {
            const newZoom = Math.max(mapZoom - 1, 3);
            setMapZoom(newZoom);
            mapRef.current.setCenter(coords, newZoom);
        }
    };

    const handleCreate = async () => {
        if (!title.trim() || !startAt || !endAt) {
            Alert.alert("Ошибка", "Пожалуйста, заполните обязательные поля");
            return;
        }

        if (endAt <= startAt) {
            Alert.alert("Ошибка", "Дата окончания должна быть позже даты начала");
            return;
        }

        const token = AuthTokenManager.getToken();
        if (!token) {
            Alert.alert("Ошибка", "Для создания события необходимо авторизоваться");
            return;
        }

        setIsLoading(true);

        try {
            const locationString = coords
                ? `${location.trim()}|${coords.lat},${coords.lon}`
                : location.trim();

            const eventData = {
                title: title.trim(),
                description: description.trim(),
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
                location: locationString,
                isPublic: true,
            };

            const response = await fetch(`${apiUrl}/api/Events/create-public`, {
                method: "POST",
                headers: {
                    accept: "text/plain",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Ошибка сервера:", response.status, errorText);
                throw new Error(errorText || "Ошибка создания события");
            }

            clearForm();
            router.push({ pathname: "/EventsScreen", params: { refresh: "true" } });
            Alert.alert("Событие успешно создано!");

        } catch (error: any) {
            Alert.alert("Ошибка", error.message);
        } finally {
        setIsLoading(false);
    }
    };
    const clearForm = () => {
        setTitle("");
        setDescription("");
        setLocation("");
        setStartAt(null);
        setEndAt(null);
    };

    const formatDateForDisplay = (date: Date | null) => {
        if (!date) return "";
        return `${date.toLocaleDateString("ru-RU")} ${date.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#fff' }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Новое событие</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Название *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Название события"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Описание</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="О чем это событие?"
                        placeholderTextColor="#999"
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Место проведения</Text>
                    <View style={styles.locationInputRow}>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setMapModalVisible(true)}>
                            <Text style={startAt ? styles.dateText : styles.placeholderText}>
                                {location ? location : "Выберите адрес на карте"}
                            </Text>
                            <Ionicons name="map-outline" size={22} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Начало *</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setStartPickerVisible(true)}>
                        <Text style={startAt ? styles.dateText : styles.placeholderText}>
                            {startAt ? formatDateForDisplay(startAt) : "Выберите дату и время"}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    <Text style={styles.label}>Окончание *</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setEndPickerVisible(true)}>
                        <Text style={endAt ? styles.dateText : styles.placeholderText}>
                            {endAt ? formatDateForDisplay(endAt) : "Выберите дату и время"}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.publishButton, isLoading && styles.publishButtonDisabled]}
                    onPress={handleCreate}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Создать событие</Text>}
                </TouchableOpacity>
            </ScrollView>

            {/* Пикеры дат */}
            <DateTimePickerModal
                isVisible={isStartPickerVisible}
                mode="datetime"
                onConfirm={(date) => { setStartAt(date); setStartPickerVisible(false); }}
                onCancel={() => setStartPickerVisible(false)}
            />
            <DateTimePickerModal
                isVisible={isEndPickerVisible}
                mode="datetime"
                onConfirm={(date) => { setEndAt(date); setEndPickerVisible(false); }}
                onCancel={() => setEndPickerVisible(false)}
            />

            {/* Модальное окно с картой */}
            <Modal visible={isMapModalVisible} animationType="slide" statusBarTranslucent>
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
                                onChangeText={(text) => {
                                    setSearchQuery(text);
                                    searchPlaces(text);
                                }}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => {
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }}>
                                    <Ionicons name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setMapModalVisible(false);
                                setSearchQuery("");
                                setSearchResults([]);
                            }}
                        >
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Результаты поиска */}
                    {searchResults.length > 0 && (
                        <View style={styles.searchResults}>
                            <ScrollView keyboardShouldPersistTaps="handled">
                                {searchResults.map((result, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.searchResultItem}
                                        onPress={() => selectSearchResult(result)}
                                    >
                                        <Ionicons name="location-outline" size={20} color="#2A6E3F" />
                                        <View style={styles.searchResultTexts}>
                                            <Text style={styles.searchResultName}>{result.name}</Text>
                                            {result.description && (
                                                <Text style={styles.searchResultDescription}>{result.description}</Text>
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

                    {/* Кнопки зума */}
                    <View style={styles.zoomControls}>
                        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
                            <Ionicons name="add" size={24} color="#333" />
                        </TouchableOpacity>
                        <View style={styles.zoomDivider} />
                        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
                            <Ionicons name="remove" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Кнопка моей локации */}
                    <TouchableOpacity style={styles.myLocationButton} onPress={getUserLocation}>
                        <Ionicons name="locate" size={24} color="#333" />
                    </TouchableOpacity>

                    {/* Нижняя панель с информацией и кнопками */}
                    {coords && (
                        <View style={styles.bottomPanel}>
                            <View style={styles.selectedLocationInfo}>
                                <Ionicons name="location" size={20} color="#2A6E3F" />
                                <Text style={styles.selectedLocationText} numberOfLines={2}>
                                    {location || "Выберите место на карте"}
                                </Text>
                            </View>

                            <View style={styles.bottomButtons}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => {
                                        setMapModalVisible(false);
                                        setSearchQuery("");
                                        setSearchResults([]);
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Отмена</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmBtn, !coords && styles.disabledBtn]}
                                    onPress={handleConfirmLocation}
                                    disabled={!coords}
                                >
                                    <Text style={styles.confirmBtnText}>Подтвердить</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        backgroundColor: "#f8fafc",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 25,
        paddingVertical: 12,
    },
    backButton: {
        marginRight: 10,
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        color: "#555",
        marginBottom: 6,
        marginTop: 12,
        fontWeight: "600",
    },
    input: {
        backgroundColor: "#f7f7f7",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        marginBottom: 14,
    },
    textArea: {
        height: 200,
        textAlignVertical: "top",
    },
    dateInput: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f7f7f7",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
    },
    dateText: {
        fontSize: 15,
        color: "#333",
    },
    placeholderText: {
        fontSize: 15,
        color: "#9ca3af",
    },
    publishButton: {
        backgroundColor: "#0f6319",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 16,
    },
    publishButtonDisabled: {
        backgroundColor: "#9ca3af",
    },
    publishButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        width: "100%",
    },
    iosPickerHeader: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingBottom: 10,
    },
    iosPickerButton: {
        fontSize: 16,
        color: "#0f6319",
        fontWeight: "600",
    },
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
    searchResultItemLast: {
        borderBottomWidth: 0,
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
        bottom: 140,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        bottom: 250,
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
    bottomButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 10,
        backgroundColor: '#f7f7f7',
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '600',
    },
    confirmBtn: {
        flex: 1,
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
    disabledBtn: {
        opacity: 0.5,
        backgroundColor: '#9ca3af',
        borderColor: '#9ca3af',
    },
});
