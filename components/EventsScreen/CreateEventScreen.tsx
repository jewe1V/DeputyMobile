import React, { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { router, useLocalSearchParams } from "expo-router"; // Добавлен useLocalSearchParams
import { apiUrl } from "@/api/api";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";
import { LinearGradient } from "expo-linear-gradient";
import LocationPickerModal from "./LocationPickerModal";
import Toast from "react-native-toast-message";
import { ArrowLeft } from "lucide-react-native";
import { PeoplePickerModal } from "@/components/EventsScreen/PeoplePickerModal";

type User = { id: string; full_name: string; email: string };
type Department = { id: string; name: string };

export default function CreateEventScreen() {
    // Получаем id из параметров маршрута и вычисляем режим
    const { id } = useLocalSearchParams<{ id: string }>();
    const isEditMode = !!id;

    const isAdmin = AuthManager.getRole() === "Admin";
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    // Основные поля формы
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);
    const [eventType, setEventType] = useState<string>();
    const [isPublic, setIsPublic] = useState(isAdmin);
    const [isPeoplePickerVisible, setPeoplePickerVisible] = useState(false);

    // Списки приглашений
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);

    // Состояния UI
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(isEditMode); // Загрузка данных для редактирования
    const [isMapModalVisible, setMapModalVisible] = useState(false);

    // Состояния Dropdown'ов
    const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);

    const eventTypes = [
        { label: 'Мероприятие', value: 'Event' },
        { label: 'Заседание', value: 'Meeting' },
        { label: 'Комиссия', value: 'Commission' },
    ];

    const selectedType = eventTypes.find(item => item.value === eventType);

    useEffect(() => {
        fetchUsersAndDepartments();
        if (isEditMode) {
            fetchEventData();
        }
    }, [isEditMode]);

    const fetchUsersAndDepartments = async () => {
        const token = AuthManager.getToken();
        if (!token) return;

        try {
            const headers = {
                accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const [depsRes, usersRes] = await Promise.all([
                fetch(`${apiUrl}/api/Department/get-all`, { headers }),
                fetch(`${apiUrl}/api/Auth/all`, { headers })
            ]);

            if (depsRes.ok) {
                const depsData = await depsRes.json();
                setDepartments(depsData);
            }
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
            }
        } catch (error) {
            console.error("Ошибка загрузки списков:", error);
        }
    };

    // Функция загрузки данных существующего события
    const fetchEventData = async () => {
        const token = AuthManager.getToken();
        if (!token) return;

        try {
            // Укажи здесь правильный эндпоинт твоего API для получения события по ID
            const response = await fetch(`${apiUrl}/api/Events/${id}`, {
                headers: {
                    accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTitle(data.title || "");
                setDescription(data.description || "");
                setStartAt(new Date(data.start_at));
                setEndAt(new Date(data.end_at));
                setEventType(data.type);
                setIsPublic(data.is_public ?? isAdmin);

                // Восстанавливаем локацию и координаты, если они были сохранены в формате "Адрес|lat,lon"
                if (data.location) {
                    const parts = data.location.split('|');
                    setLocation(parts[0]);
                    if (parts.length > 1) {
                        const [lat, lon] = parts[1].split(',');
                        setCoords({ lat: parseFloat(lat), lon: parseFloat(lon) });
                    }
                }

                if (data.user_ids) setSelectedUserIds(data.user_ids);
                if (data.department_ids) setSelectedDepartmentIds(data.department_ids);
            } else {
                throw new Error("Не удалось загрузить данные события");
            }
        } catch (error) {
            console.error("Ошибка загрузки события:", error);
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось загрузить данные для редактирования',
                position: 'top',
            });
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleLocationSelected = (locationData: { address: string; coords: { lat: number; lon: number } }) => {
        setLocation(locationData.address);
        setCoords(locationData.coords);
    };

    const handleStartDateConfirm = (date: Date) => {
        setStartAt(date);
        setStartPickerVisible(false);
    };

    const handleEndDateConfirm = (date: Date) => {
        setEndAt(date);
        setEndPickerVisible(false);
    };

    // Переименовал в handleSave, чтобы логично звучало для обоих режимов
    const handleSave = async () => {
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

        if (!isPublic && selectedUserIds.length === 0 && selectedDepartmentIds.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Внимание',
                text2: 'Для приватного мероприятия выберите пользователей или отделы',
                position: 'top',
                visibilityTime: 4000,
            });
            return;
        }

        const token = AuthManager.getToken();
        if (!token) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Необходимо авторизоваться',
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

            const baseEventData = {
                title: title.trim(),
                description: description.trim(),
                start_at: startAt.toISOString(),
                end_at: endAt.toISOString(),
                location: locationString,
                type: eventType,
            };

            let endpoint = "";
            let method = isEditMode ? "PUT" : "POST";
            let requestBody: any = {};

            if (isEditMode) {
                endpoint = `${apiUrl}/api/Events/${id}`;
                requestBody = {
                    ...baseEventData,
                    is_public: isPublic,
                    user_ids: selectedUserIds,
                    department_ids: selectedDepartmentIds
                };
            } else {
                if (isPublic) {
                    endpoint = `${apiUrl}/api/Events/create-public`;
                    requestBody = baseEventData;
                } else {
                    endpoint = `${apiUrl}/api/Events/create-private`;
                    requestBody = {
                        ...baseEventData,
                        user_ids: selectedUserIds,
                        department_ids: selectedDepartmentIds
                    };
                }
            }

            console.log("Эндпоинт:", endpoint, "Метод:", method);

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    "accept": "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = responseText;
                try {
                    const errorJson = JSON.parse(responseText);
                    errorMessage = errorJson.message || errorJson.title || responseText;
                } catch {}
                throw new Error(errorMessage || `Ошибка ${isEditMode ? 'обновления' : 'создания'} события`);
            }

            Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: `Событие успешно ${isEditMode ? 'обновлено' : 'создано'}`,
                position: 'top',
                visibilityTime: 3000,
            });

            if (!isEditMode) clearForm();
            router.push({ pathname: "/(screens)/EventsScreen", params: { refresh: "true" } });
        } catch (error: any) {
            console.error("Полная ошибка:", error);
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: error.message || 'Произошла ошибка',
                position: 'top',
                visibilityTime: 4000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateForDisplay = (date: Date | null) => {
        if (!date) return "";
        return `${date.toLocaleDateString("ru-RU")} ${date.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    };

    const clearForm = () => {
        setTitle("");
        setDescription("");
        setLocation("");
        setCoords(null);
        setStartAt(null);
        setEndAt(null);
        setEventType(undefined);
        setIsPublic(isAdmin);
        setSelectedUserIds([]);
        setSelectedDepartmentIds([]);
    };

    // Если данные еще грузятся, показываем лоадер вместо формы
    if (isDataLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0f6319" />
            </View>
        );
    }

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
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <View pointerEvents="none">
                            <ArrowLeft size={24} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isEditMode ? "Редактирование события" : "Новое событие"}</Text>
                </LinearGradient>

                <View style={styles.card}>
                    {!isAdmin && (
                        <View style={styles.warningAlert}>
                            <Ionicons name="information-circle-outline" size={24} color="#b45309" style={{ marginTop: 2 }}/>
                            <Text style={styles.warningText}>
                                Вы можете создавать только приватные мероприятия. Обязательно выберите пользователей или отделы для рассылки приглашений.
                            </Text>
                        </View>
                    )}

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

                    {isAdmin && (
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => {
                                setIsPublic(!isPublic);
                                if (!isPublic) {
                                    setSelectedUserIds([]);
                                    setSelectedDepartmentIds([]);
                                }
                            }}
                        >
                            <Text style={styles.checkboxLabel}>Публичное мероприятие</Text>
                            <View style={[styles.checkbox, isPublic && styles.checkboxChecked]}>
                                {isPublic && <Ionicons name="checkmark" size={18} color="#fff" />}
                            </View>
                        </TouchableOpacity>
                    )}

                    {(!isPublic || !isAdmin) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {!isAdmin && !isPublic ? "Приглашения *" : "Приглашения"}
                            </Text>
                            <TouchableOpacity
                                style={styles.inviteButton}
                                onPress={() => setPeoplePickerVisible(true)}
                            >
                                <View style={styles.inviteButtonContent}>
                                    <Ionicons name="people-outline" size={24} color="#0f6319" />
                                    <View>
                                        <Text style={styles.inviteButtonTitle}>Выбрать участников</Text>
                                        <Text style={styles.inviteButtonSubtitle}>
                                            {selectedUserIds.length + selectedDepartmentIds.length > 0
                                                ? `Выбрано: ${selectedUserIds.length} пользователей, ${selectedDepartmentIds.length} отделов`
                                                : "Нажмите для выбора пользователей и отделов"}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.publishButton, isLoading && styles.publishButtonDisabled]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>{isEditMode ? "Сохранить изменения" : "Создать"}</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>

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

            <LocationPickerModal
                visible={isMapModalVisible}
                onClose={() => setMapModalVisible(false)}
                onLocationSelected={handleLocationSelected}
                initialLocation={location}
                initialCoords={coords}
            />

            <PeoplePickerModal
                visible={isPeoplePickerVisible}
                onClose={() => setPeoplePickerVisible(false)}
                users={users}
                departments={departments}
                selectedUserIds={selectedUserIds}
                selectedDepartmentIds={selectedDepartmentIds}
                onConfirm={(userIds, departmentIds) => {
                    setSelectedUserIds(userIds);
                    setSelectedDepartmentIds(departmentIds);
                }}
                mode="both"
            />
        </KeyboardAvoidingView>
    );
}

// ...оставляем стили без изменений
const styles = StyleSheet.create({
    container: { flexGrow: 1 },
    header: { flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 25, paddingHorizontal: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
    card: { borderRadius: 16, padding: 20, marginBottom: 20 },
    warningAlert: { flexDirection: 'row', backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde047', borderRadius: 10, padding: 12, marginBottom: 6, marginTop: -36 },
    warningText: { flex: 1, color: '#b45309', fontSize: 14, marginLeft: 8, lineHeight: 20 },
    input: { backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 14, marginTop: 8 },
    textArea: { textAlignVertical: "top", minHeight: 100 },
    unifiedInput: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14, marginTop: 8 },
    inputText: { fontSize: 15, color: "#333", flex: 1 },
    placeholderText: { fontSize: 15, color: "#9ca3af", flex: 1 },
    publishButton: { backgroundColor: "#0f6319", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, marginTop: 25 },
    publishButtonDisabled: { backgroundColor: "#9ca3af" },
    publishButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    selectWrapper: { marginBottom: 14, marginTop: 8, position: 'relative', zIndex: 1000 },
    selectTrigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
    selectValue: { fontSize: 15, color: "#333", flex: 1 },
    selectDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, zIndex: 1001 },
    selectItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    selectItemSelected: { backgroundColor: '#f0f7f0' },
    selectItemText: { fontSize: 15, color: '#333' },
    selectItemTextSelected: { color: '#0f6319', fontWeight: '500' },
    checkboxContainer: { backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 14, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: '#6b7280', justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#0f6319', borderColor: '#0f6319' },
    checkboxLabel: { fontSize: 15, color: '#333' },
    section: { marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    inviteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f7f7f7', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 },
    inviteButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    inviteButtonTitle: { fontSize: 15, fontWeight: '500', color: '#333' },
    inviteButtonSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
