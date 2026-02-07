import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker"; // ✅ Новый импорт
import { AuthTokenManager } from "@/components/LoginScreen/LoginScreen";
import { apiUrl } from "@/api/api";

export default function CreateEventScreen() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

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
            const eventData = {
                title: title.trim(),
                description: description.trim(),
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
                location: location.trim(),
                isPublic: true,
            };

            const response = await fetch(`${apiUrl}/api/Events`, {
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
            console.error(error);
            Alert.alert("Ошибка", error.message || "Не удалось создать событие.");
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
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            clearForm();
                            router.push("/EventsScreen");
                        }}
                        style={styles.backButton}
                        disabled={isLoading}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Запланировать событие</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Название *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Введите название"
                        value={title}
                        onChangeText={setTitle}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Описание</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Введите описание"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Место проведения</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Введите место"
                        value={location}
                        onChangeText={setLocation}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Дата и время начала *</Text>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setStartPickerVisible(true)}
                    >
                        <Text style={startAt ? styles.dateText : styles.placeholderText}>
                            {startAt ? formatDateForDisplay(startAt) : "Выберите дату начала"}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    <Text style={styles.label}>Дата и время окончания *</Text>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setEndPickerVisible(true)}
                    >
                        <Text style={endAt ? styles.dateText : styles.placeholderText}>
                            {endAt ? formatDateForDisplay(endAt) : "Выберите дату окончания"}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.publishButton, isLoading && styles.publishButtonDisabled]}
                    onPress={handleCreate}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="add-circle-outline" size={22} color="#fff" />
                    )}
                    <Text style={styles.publishButtonText}>
                        {isLoading ? "Создание..." : "Создать событие"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* ✅ Новый безопасный DateTimePicker */}
            <DateTimePickerModal
                isVisible={isStartPickerVisible}
                mode="datetime"
                date={startAt || new Date()}
                minimumDate={new Date()}
                onConfirm={(date) => {
                    setStartAt(date);
                    setStartPickerVisible(false);
                    if (!endAt || endAt <= date) {
                        const end = new Date(date);
                        end.setHours(end.getHours() + 2);
                        setEndAt(end);
                    }
                }}
                onCancel={() => setStartPickerVisible(false)}
            />

            <DateTimePickerModal
                isVisible={isEndPickerVisible}
                mode="datetime"
                date={endAt || new Date()}
                minimumDate={startAt || new Date()}
                onConfirm={(date) => {
                    setEndAt(date);
                    setEndPickerVisible(false);
                }}
                onCancel={() => setEndPickerVisible(false)}
            />
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
});
