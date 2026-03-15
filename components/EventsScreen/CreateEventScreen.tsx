import React, { useState, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { router } from "expo-router";
import { apiUrl } from "@/api/api";
import { AuthTokenManager } from "@/components/LoginScreen/LoginScreen";
import { LinearGradient } from "expo-linear-gradient";
import LocationPickerModal from "./LocationPickerModal";
import Toast from "react-native-toast-message";

export default function CreateEventScreen() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMapModalVisible, setMapModalVisible] = useState(false);
    const [eventType, setEventType] = useState<string>();
    const [isPublic, setIsPublic] = useState(true);
    const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);

    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    const eventTypes = [
        { label: 'Мероприятие', value: 'Event' },
        { label: 'Заседание', value: 'Meeting' },
        { label: 'Комиссия', value: 'Commission' },
    ];

    const selectedType = eventTypes.find(item => item.value === eventType);

    const handleLocationSelected = (locationData: { address: string; coords: { lat: number; lon: number } }) => {
        setLocation(locationData.address);
        setCoords(locationData.coords);
    };

    // Исправленные обработчики для DateTimePicker
    const handleStartDateConfirm = (date: Date) => {
        // Создаем новую дату и устанавливаем в UTC
        const utcDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ));
        setStartAt(utcDate);
        setStartPickerVisible(false);
    };

    const handleEndDateConfirm = (date: Date) => {
        const utcDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ));
        setEndAt(utcDate);
        setEndPickerVisible(false);
    };

    const handleCreate = async () => {
        if (!title.trim() || !startAt || !endAt || !eventType) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Пожалуйста, заполните все обязательные поля',
                position: 'top',
                visibilityTime: 3000,
            });
            return;
        }

        // Сравниваем UTC даты
        if (endAt.getTime() <= startAt.getTime()) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Дата окончания должна быть позже даты начала',
                position: 'top',
                visibilityTime: 3000,
            });
            return;
        }

        const token = AuthTokenManager.getToken();
        if (!token) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Для создания события необходимо авторизоваться',
                position: 'top',
                visibilityTime: 3000,
            });
            return;
        }

        setIsLoading(true);

        try {
            const locationString = coords
                ? `${location.trim()}|${coords.lat},${coords.lon}`
                : location.trim();

            // Используем уже UTC даты
            const eventData = {
                title: title.trim(),
                description: description.trim(),
                start_at: startAt.toISOString(), // теперь это будет корректная UTC строка
                end_at: endAt.toISOString(),
                location: locationString,
                isPublic: isPublic,
                type: eventType,
            };

            console.log("Отправляемые данные:", JSON.stringify(eventData, null, 2));

            const response = await fetch(`${apiUrl}/api/Events/create-public`, {
                method: "POST",
                headers: {
                    accept: "text/plain",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(eventData),
            });

            const responseText = await response.text();
            console.log(eventData);
            console.log("Ответ сервера:", response.status, responseText);

            if (!response.ok) {
                throw new Error(responseText || "Ошибка создания события");
            }

            clearForm();
            router.push({ pathname: "/(screens)/EventsScreen", params: { refresh: "true" } });
        } catch (error: any) {
            console.error("Полная ошибка:", error);
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: error.message || 'Произошла ошибка при создании события',
                position: 'top',
                visibilityTime: 4000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const clearForm = () => {
        setTitle("");
        setDescription("");
        setLocation("");
        setCoords(null);
        setStartAt(null);
        setEndAt(null);
        setEventType("Event");
        setIsPublic(true);
    };

    const formatDateForDisplay = (date: Date | null) => {
        if (!date) return "";
        // Для отображения конвертируем UTC обратно в локальное время
        const localDate = new Date(date);
        return `${localDate.toLocaleDateString("ru-RU")} ${localDate.toLocaleTimeString("ru-RU", {
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
                contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={['#2A6E3F', '#349339']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 20 }]}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Новое событие</Text>
                </LinearGradient>

                <View style={styles.card}>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Название *"
                        placeholderTextColor="#999"
                    />

                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={8}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Описание *"
                        placeholderTextColor="#999"
                        textAlignVertical="top"
                    />

                    <TouchableOpacity style={styles.unifiedInput} onPress={() => setMapModalVisible(true)}>
                        <Text style={location ? styles.inputText : styles.placeholderText}>
                            {location ? location : "Выберите адрес на карте *"}
                        </Text>
                        <Ionicons name="map-outline" size={22} color="#6b7280" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.unifiedInput} onPress={() => setStartPickerVisible(true)}>
                        <Text style={startAt ? styles.inputText : styles.placeholderText}>
                            {startAt ? formatDateForDisplay(startAt) : "Выберите дату и время начала *"}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.unifiedInput} onPress={() => setEndPickerVisible(true)}>
                        <Text style={endAt ? styles.inputText : styles.placeholderText}>
                            {endAt ? formatDateForDisplay(endAt) : "Выберите дату и время окончания *"}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    <View style={styles.selectWrapper}>
                        <TouchableOpacity
                            style={styles.selectTrigger}
                            onPress={() => setIsTypeSelectOpen(!isTypeSelectOpen)}
                        >
                            <Text style={!eventType ? styles.placeholderText : styles.selectValue}>
                                {selectedType?.label || 'Тип *'}
                            </Text>
                            <Ionicons
                                name={isTypeSelectOpen ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>

                        {isTypeSelectOpen && (
                            <View style={styles.selectDropdown}>
                                {eventTypes.map((item) => (
                                    <TouchableOpacity
                                        key={item.value}
                                        style={[
                                            styles.selectItem,
                                            eventType === item.value && styles.selectItemSelected
                                        ]}
                                        onPress={() => {
                                            setEventType(item.value);
                                            setIsTypeSelectOpen(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.selectItemText,
                                            eventType === item.value && styles.selectItemTextSelected
                                        ]}>
                                            {item.label}
                                        </Text>
                                        {eventType === item.value && (
                                            <Ionicons name="checkmark" size={18} color="#0f6319" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Чекбокс публичности */}
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setIsPublic(!isPublic)}
                    >
                        <Text style={styles.checkboxLabel}>Публичное</Text>
                        <View style={[styles.checkbox, isPublic && styles.checkboxChecked]}>
                            {isPublic && <Ionicons name="checkmark" size={18} color="#fff" />}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.publishButton, isLoading && styles.publishButtonDisabled]}
                        onPress={handleCreate}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Создать</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Пикеры дат - обновленные обработчики */}
            <DateTimePickerModal
                isVisible={isStartPickerVisible}
                mode="datetime"
                onConfirm={handleStartDateConfirm}
                onCancel={() => setStartPickerVisible(false)}
            />
            <DateTimePickerModal
                isVisible={isEndPickerVisible}
                mode="datetime"
                onConfirm={handleEndDateConfirm}
                onCancel={() => setEndPickerVisible(false)}
            />

            {/* Модальное окно с картой */}
            <LocationPickerModal
                visible={isMapModalVisible}
                onClose={() => setMapModalVisible(false)}
                onLocationSelected={handleLocationSelected}
                initialLocation={location}
                initialCoords={coords}
            />
        </KeyboardAvoidingView>
    );
}
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 20,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backButton: {
        marginRight: 10,
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
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
        marginTop: 8,
    },
    textArea: {
        textAlignVertical: "top",
    },
    unifiedInput: {
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
        marginTop: 8,
    },
    inputText: {
        fontSize: 15,
        color: "#333",
        flex: 1,
    },
    placeholderText: {
        fontSize: 15,
        color: "#9ca3af",
        flex: 1,
    },
    publishButton: {
        backgroundColor: "#0f6319",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 25,

    },
    publishButtonDisabled: {
        backgroundColor: "#9ca3af",
    },
    publishButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    // Стили для Select
    selectWrapper: {
        marginBottom: 14,
        marginTop: 8,
        position: 'relative',
        zIndex: 1000,
    },
    selectTrigger: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f7f7f7",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    selectValue: {
        fontSize: 15,
        color: "#333",
        flex: 1,
    },
    selectDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1001,
    },
    selectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectItemSelected: {
        backgroundColor: '#f0f7f0',
    },
    selectItemText: {
        fontSize: 15,
        color: '#333',
    },
    selectItemTextSelected: {
        color: '#0f6319',
        fontWeight: '500',
    },
    // Стили для чекбокса
    checkboxContainer: {
        backgroundColor: "#f7f7f7",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        marginBottom: 14,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#6b7280',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#0f6319',
    },
    checkboxLabel: {
        fontSize: 15,
        color: '#333',
    },
});
