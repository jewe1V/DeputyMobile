import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { apiUrl } from "@/api/api";
import { Profile } from "@/models/ProfileModel";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";
import { SelectionPopup } from "@/components/UsersScreen/SelectionPopup";
import Toast from "react-native-toast-message";
import { Building2 } from "lucide-react-native";

const CreateUserScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const isEditMode = !!id;

    // Состояния формы
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [selectedDeputy, setSelectedDeputy] = useState<Profile | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<{id: string, name: string} | null>(null);

    // Состояния UI
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRoleSelectOpen, setIsRoleSelectOpen] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [deputies, setDeputies] = useState<Profile[]>([]);
    const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);

    const [deputyPopupVisible, setDeputyPopupVisible] = useState(false);
    const [departmentPopupVisible, setDepartmentPopupVisible] = useState(false);

    const token = AuthManager.getToken();
    const roles = ['Admin', 'Deputy', 'Helper'];

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Загружаем справочники параллельно
                const [depsRes, deptsRes] = await Promise.all([
                    fetch(`${apiUrl}/api/Auth/role/Deputy`, {
                        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${apiUrl}/api/Department/get-all`, {
                        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const fetchedDeputies = await depsRes.json();
                const fetchedDepartments = await deptsRes.json();

                setDeputies(fetchedDeputies);
                setDepartments(fetchedDepartments);

                // 2. Если режим редактирования, подтягиваем данные пользователя
                if (isEditMode) {
                    const profileRes = await fetch(`${apiUrl}/api/Auth/${id}`, {
                        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
                    });

                    if (profileRes.ok) {
                        const profileData = await profileRes.json();

                        setFullName(profileData.full_name || '');
                        setEmail(profileData.email || '');
                        setJobTitle(profileData.job_title || '');

                        if (profileData.roles && profileData.roles.length > 0) {
                            setSelectedRole(profileData.roles[0]);
                        }

                        // Пытаемся привязать департамент
                        if (profileData.department_id || profileData.department) {
                            const foundDept = fetchedDepartments.find(
                                (d: any) => d.id === profileData.department_id || d.name === profileData.department
                            );
                            if (foundDept) setSelectedDepartment(foundDept);
                        }

                        // Пытаемся привязать депутата (если он помощник)
                        if (profileData.deputy_id) {
                            const foundDeputy = fetchedDeputies.find((d: any) => d.id === profileData.deputy_id);
                            if (foundDeputy) setSelectedDeputy(foundDeputy);
                        }
                    }
                }
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
                Toast.show({
                    type: 'error',
                    text1: 'Ошибка',
                    text2: 'Не удалось загрузить данные',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [id, isEditMode, token]);

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let newPassword = "";
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(newPassword);
        setIsPasswordVisible(true);
    };

    const copyPassword = async () => {
        if (!password) return;
        await Clipboard.setStringAsync(password);
        Toast.show({
            type: "success",
            text1: 'Скопировано',
            visibilityTime: 1000
        });
    };

    const handleSubmit = async () => {
        // 1. Валидация
        // Пароль проверяем только при создании
        const isPasswordValid = isEditMode ? true : !!password;
        if (!fullName || !email || !isPasswordValid || !selectedRole) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка заполнения',
                text2: 'Заполните все обязательные поля (*)',
                position: 'bottom'
            });
            return;
        }

        setIsSubmitting(true);

        // 2. Формируем Payload строго по схемам
        let payload: any;
        const endpoint = isEditMode ? `${apiUrl}/api/Auth/update` : `${apiUrl}/api/Auth/create`;

        if (isEditMode) {
            // Схема для РЕДАКТИРОВАНИЯ
            payload = {
                id: id,
                email,
                job_title: jobTitle,
                full_name: fullName,
                deputy_id: selectedRole === 'Helper' ? selectedDeputy?.id : null,
                department_id: selectedDepartment?.id || null,
                user_roles: [selectedRole] // В схеме обновления именно user_roles
            };
        } else {
            // Схема для СОЗДАНИЯ
            payload = {
                email,
                job_title: jobTitle,
                full_name: fullName,
                password,
                roles: [selectedRole], // В схеме создания именно roles
                deputy_id: selectedRole === 'Helper' ? selectedDeputy?.id : null,
                department_id: selectedDepartment?.id || null,
            };
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Успешно',
                    text2: isEditMode ? 'Профиль обновлен' : 'Пользователь создан',
                });
                setTimeout(() => router.back(), 1500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Ошибка API:", errorData);
                Toast.show({
                    type: 'error',
                    text1: 'Ошибка сервера',
                    text2: errorData.message || 'Что-то пошло не так',
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#2A6E3F" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#fff' }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
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
                    <Text style={styles.headerTitle}>
                        {isEditMode ? 'Редактирование профиля' : 'Регистрация'}
                    </Text>
                </LinearGradient>

                <View style={styles.card}>
                    {/* ФИО, Email, Должность, Департамент — остаются без изменений */}
                    <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="ФИО *" />
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email *" />
                    <TextInput style={styles.input} value={jobTitle} onChangeText={setJobTitle} placeholder="Должность" />

                    {/* Выбор департамента */}
                    <TouchableOpacity style={styles.selectTrigger} onPress={() => setDepartmentPopupVisible(true)}>
                        <Text style={selectedDepartment ? styles.selectValue : styles.placeholderText}>
                            {selectedDepartment ? selectedDepartment.name : 'Департамент'}
                        </Text>
                    </TouchableOpacity>

                    {/* ПАРОЛЬ: Показываем только если НЕ режим редактирования */}
                    {!isEditMode && (
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Пароль *"
                                secureTextEntry={!isPasswordVisible}
                            />
                            <View style={styles.passwordActions}>
                                <TouchableOpacity onPress={generatePassword} style={styles.iconButton}>
                                    <Ionicons name="refresh-outline" size={20} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={copyPassword} style={styles.iconButton}>
                                    <Ionicons name="copy-outline" size={20} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.iconButton}>
                                    <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Выбор Роли */}
                    <View style={[styles.selectWrapper, { zIndex: 1000 }]}>
                        <TouchableOpacity
                            style={styles.selectTrigger}
                            onPress={() => setIsRoleSelectOpen(!isRoleSelectOpen)}
                        >
                            <Text style={!selectedRole ? styles.placeholderText : styles.selectValue}>
                                {selectedRole || 'Выберите роль *'}
                            </Text>
                            <Ionicons
                                name={isRoleSelectOpen ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>

                        {isRoleSelectOpen && (
                            <View style={styles.selectDropdown}>
                                {roles.map((role) => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            styles.selectItem,
                                            selectedRole === role && styles.selectItemSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedRole(role);
                                            setIsRoleSelectOpen(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.selectItemText,
                                            selectedRole === role && styles.selectItemTextSelected
                                        ]}>
                                            {role}
                                        </Text>
                                        {selectedRole === role && (
                                            <Ionicons name="checkmark" size={18} color="#0f6319" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Выбор Депутата (только для Helper) */}
                    {selectedRole === 'Helper' && (
                        <TouchableOpacity
                            style={styles.selectTrigger}
                            onPress={() => setDeputyPopupVisible(true)}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={selectedDeputy ? styles.selectValue : styles.placeholderText}
                                    numberOfLines={1}
                                >
                                    {selectedDeputy
                                        ? (selectedDeputy.full_name || selectedDeputy.email)
                                        : 'Привязать к депутату'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.publishButtonText}>
                                {isEditMode ? 'Сохранить изменения' : 'Создать пользователя'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Попапы */}
            <SelectionPopup
                visible={deputyPopupVisible}
                title="Выберите депутата"
                onClose={() => setDeputyPopupVisible(false)}
                data={deputies}
                keyExtractor={(item) => item.id}
                onSelect={(deputy) => setSelectedDeputy(deputy)}
                renderItem={(item: Profile) => (
                    <View style={styles.deputyItem}>
                        <View style={styles.deputyAvatar}>
                            <Text style={styles.deputyAvatarText}>
                                {(item.full_name || item.email || "?")[0].toUpperCase()}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.deputyName}>
                                {item.full_name || (item as any).fullName || item.email}
                            </Text>
                            <Text style={styles.deputyJob}>{item.job_title || 'Депутат'}</Text>
                        </View>
                    </View>
                )}
            />
            <SelectionPopup
                visible={departmentPopupVisible}
                title="Выберите департамент"
                onClose={() => setDepartmentPopupVisible(false)}
                data={departments}
                keyExtractor={(item) => item.id}
                onSelect={(dept) => setSelectedDepartment(dept)}
                renderItem={(item) => (
                    <View style={styles.deptItem}>
                        <View style={styles.deptIcon}>
                            <Building2 size={20} color="#2A6E3F" />
                        </View>
                        <Text style={styles.deptName}>{item.name}</Text>
                    </View>
                )}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: { marginRight: 10, padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
    card: { borderRadius: 16, padding: 20, marginBottom: 20 },
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#f7f7f7",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 14,
        marginTop: 8,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 15,
    },
    passwordActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 6,
        marginLeft: 4,
    },
    placeholderText: { fontSize: 15, color: "#9ca3af", flex: 1 },
    selectValue: { fontSize: 15, color: "#333", flex: 1 },
    publishButton: {
        backgroundColor: "#0f6319",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 25,
    },
    publishButtonDisabled: { backgroundColor: "#9ca3af" },
    publishButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    selectWrapper: { marginBottom: 14, position: 'relative' },
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
        marginBottom: 14,
        marginTop: 8,
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
        maxHeight: 200,
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
    selectItemSelected: { backgroundColor: '#f0f7f0' },
    selectItemText: { fontSize: 15, color: '#333' },
    selectItemTextSelected: { color: '#0f6319', fontWeight: '500' },
    inputLabel: { fontSize: 15, color: '#9ca3af' },
    deputyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    deputyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ebfdeb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    deputyAvatarText: { color: '#2A6E3F', fontWeight: '700' },
    deputyName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    deputyJob: { fontSize: 12, color: '#64748b' },
    deptItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    deptIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f0f9f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    deptName: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500'
    },
});

export default CreateUserScreen;
