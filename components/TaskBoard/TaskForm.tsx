import { taskService } from '@/api/taskService';
import { mockProfiles } from '@/data/mockData';
import { TaskPriority } from '@/data/types';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Save, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { styles } from './task-form-style';

type RootStackParamList = {
    TaskBoard: undefined;
    TaskDetail: { id: string };
    TaskForm: { id?: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TaskFormRouteProp = RouteProp<RootStackParamList, 'TaskForm'>;

const priorityOptions: { value: TaskPriority; label: string; color: string; activeColor: string }[] = [
    {
        value: 'low',
        label: 'Низкий',
        color: '#D1D5DB',
        activeColor: '#9CA3AF',
    },
    {
        value: 'medium',
        label: 'Средний',
        color: '#93C5FD',
        activeColor: '#3B82F6',
    },
    {
        value: 'high',
        label: 'Высокий',
        color: '#FDBA74',
        activeColor: '#F97316',
    },
    {
        value: 'urgent',
        label: 'Срочный',
        color: '#FCA5A5',
        activeColor: '#EF4444',
    },
];

const priorityActiveColors: Record<TaskPriority, { bg: string; border: string; text: string }> = {
    low: {
        bg: '#F3F4F6',
        border: '#9CA3AF',
        text: '#374151',
    },
    medium: {
        bg: '#DBEAFE',
        border: '#3B82F6',
        text: '#1E40AF',
    },
    high: {
        bg: '#FFEDD5',
        border: '#F97316',
        text: '#9A3412',
    },
    urgent: {
        bg: '#FEE2E2',
        border: '#EF4444',
        text: '#991B1B',
    },
};

interface PriorityButtonProps {
    option: typeof priorityOptions[0];
    isSelected: boolean;
    onPress: (value: TaskPriority) => void;
}

const PriorityButton = ({ option, isSelected, onPress }: PriorityButtonProps) => {
    const activeConfig = priorityActiveColors[option.value];

    return (
        <TouchableOpacity
            style={[
                styles.priorityButton,
                isSelected
                    ? {
                        backgroundColor: activeConfig.bg,
                        borderColor: activeConfig.border,
                        borderWidth: 2,
                    }
                    : {
                        backgroundColor: '#FFFFFF',
                        borderColor: option.color,
                        borderWidth: 1,
                    },
            ]}
            onPress={() => onPress(option.value)}
        >
            <Text
                style={[
                    styles.priorityButtonText,
                    isSelected
                        ? { color: activeConfig.text, fontWeight: '600' }
                        : { color: option.activeColor },
                ]}
            >
                {option.label}
            </Text>
        </TouchableOpacity>
    );
};

const FormSection = ({ children, title, required = false }: {
    children: React.ReactNode;
    title: string;
    required?: boolean;
}) => (
    <View style={styles.formSection}>
        <Text style={styles.formSectionTitle}>
            {title}
            {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        {children}
    </View>
);

export function TaskForm() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<TaskFormRouteProp>();
    const { id } = route.params || {};

    const isEditMode = id && id !== 'new';

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [assignedTo, setAssignedTo] = useState('1');
    const [dueDate, setDueDate] = useState('');
    const [tags, setTags] = useState('');
    const [isAssignedToOpen, setIsAssignedToOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Для создания задачи автоматически выставляется дата начала (текущее время)
    const startDate = new Date().toISOString();

    const handleSubmit = async () => {
        if (!title.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Введите название задачи',
            });
            return;
        }

        if (!description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Введите описание задачи',
            });
            return;
        }

        if (!dueDate) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Укажите планируемую дату завершения',
            });
            return;
        }

        // Проверка, что дата завершения >= даты начала
        const dueDateObj = new Date(dueDate);
        const startDateObj = new Date(startDate);

        if (dueDateObj < startDateObj) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Дата завершения не может быть раньше даты начала',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                startDate: startDate,
                expectedEndDate: new Date(dueDate).toISOString(),
                priority: getPriorityNumber(priority),
                status: 'created',
            };

            await taskService.createTask(payload);
            
            Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Задача успешно создана',
            });
            
            navigation.goBack();
        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось создать задачу',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Отмена',
            'Вы уверены, что хотите отменить создание задачи? Все несохраненные изменения будут потеряны.',
            [
                { text: 'Продолжить редактирование', style: 'cancel' },
                {
                    text: 'Отменить',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                },
            ]
        );
    };

    const selectedProfile = mockProfiles.find(p => p.id === assignedTo);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#2A6E3F" barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleCancel}
                >
                    <ArrowLeft size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>
                        {isEditMode ? 'Редактировать задачу' : 'Новая задача'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Название */}
                    <FormSection title="Название задачи" required>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Введите название задачи"
                            placeholderTextColor="#9CA3AF"
                            maxLength={100}
                        />
                    </FormSection>

                    {/* Описание */}
                    <FormSection title="Описание" required>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Введите подробное описание задачи"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                        <Text style={styles.helperText}>
                            Опишите задачу максимально подробно
                        </Text>
                    </FormSection>

                    {/* Приоритет */}
                    <FormSection title="Приоритет" required>
                        <View style={styles.priorityGrid}>
                            {priorityOptions.map((option) => (
                                <PriorityButton
                                    key={option.value}
                                    option={option}
                                    isSelected={priority === option.value}
                                    onPress={setPriority}
                                />
                            ))}
                        </View>
                        <Text style={styles.helperText}>
                            Выберите приоритет выполнения задачи
                        </Text>
                    </FormSection>

                    {/* Дата начала (только показываем, не редактируем при создании) */}
                    {!isEditMode && (
                        <FormSection title="Дата начала">
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={startDate.replace('T', ' ')}
                                editable={false}
                                placeholderTextColor="#9CA3AF"
                            />
                            <Text style={styles.helperText}>
                                Автоматически устанавливается на текущее время
                            </Text>
                        </FormSection>
                    )}

                    {/* Планируемая дата завершения */}
                    <FormSection title="Планируемая дата завершения" required>
                        <TextInput
                            style={styles.input}
                            value={dueDate}
                            onChangeText={setDueDate}
                            placeholder="YYYY-MM-DD HH:MM"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numbers-and-punctuation"
                        />
                        <Text style={styles.helperText}>
                            Укажите крайний срок выполнения задачи
                        </Text>
                    </FormSection>

                    {/* Исполнитель */}
                    <FormSection title="Исполнитель" required>
                        <TouchableOpacity
                            style={styles.selectTrigger}
                            onPress={() => setIsAssignedToOpen(!isAssignedToOpen)}
                        >
                            <Text style={[
                                styles.selectTriggerText,
                                !selectedProfile && { color: '#9CA3AF' }
                            ]}>
                                {selectedProfile?.fullName || 'Выберите исполнителя'}
                            </Text>
                            <Text style={styles.selectTriggerArrow}>▼</Text>
                        </TouchableOpacity>

                        {isAssignedToOpen && (
                            <View style={styles.selectDropdown}>
                                {mockProfiles.map((profile) => (
                                    <TouchableOpacity
                                        key={profile.id}
                                        style={[
                                            styles.selectOption,
                                            assignedTo === profile.id && styles.selectOptionActive,
                                        ]}
                                        onPress={() => {
                                            setAssignedTo(profile.id);
                                            setIsAssignedToOpen(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.selectOptionText,
                                            assignedTo === profile.id && styles.selectOptionTextActive,
                                        ]}>
                                            {profile.fullName}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <Text style={styles.helperText}>
                            Выберите ответственного за выполнение
                        </Text>
                    </FormSection>

                    {/* Теги */}
                    <FormSection title="Теги">
                        <TextInput
                            style={styles.input}
                            value={tags}
                            onChangeText={setTags}
                            placeholder="отчетность, благоустройство"
                            placeholderTextColor="#9CA3AF"
                        />
                        <Text style={styles.helperText}>
                            Разделяйте теги запятыми для удобного поиска
                        </Text>
                    </FormSection>

                    {/* Отступ для кнопок */}
                    <View style={styles.bottomSpacer} />
                </ScrollView>

                {/* Кнопки действий */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <Save size={16} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>
                                    {isEditMode ? 'Сохранить изменения' : 'Создать задачу'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        disabled={isSubmitting}
                    >
                        <X size={16} color="#6B7280" />
                        <Text style={styles.cancelButtonText}>Отмена</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Вспомогательная функция для преобразования приоритета
const getPriorityNumber = (priority: TaskPriority): number => {
    const priorityMap: Record<TaskPriority, number> = {
        low: 0,
        medium: 1,
        high: 2,
        urgent: 3,
    };
    return priorityMap[priority];
};
