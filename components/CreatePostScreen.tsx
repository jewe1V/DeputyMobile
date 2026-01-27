import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuScreen from './MenuScreen'
import {Header} from "@/components/Header";
import {apiUrl} from "@/api/api";

const CreateOrPlanScreen = ({ navigation }: any) => {

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [body, setBody] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();
    const handleCreatePost = async () => {
        if (!title || !summary || !body) {
            Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Токен не найден');

            const response = await fetch(`${apiUrl}/api/Posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    summary,
                    body,
                    thumbnailUrl: thumbnailUrl || null,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка: ${response.status} - ${errorText}`);
            }

            await response.json();
            Alert.alert('Пост успешно опубликован!');
            router.push({
                pathname: '/',
                params: { refresh: 'true' },
            });
        } catch (error) {
            Alert.alert('Ошибка', String(error));
        } finally {
            setLoading(false);
        }
    };

    // --- Форма публикации ---
    return (
        <KeyboardAvoidingView
            style={[{ flex: 1 }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 10}]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/(screens)/MenuScreen')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Создать пост</Text>
                </View>

                <Text style={styles.label}>Заголовок</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Введите заголовок"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Краткое описание</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Введите краткое описание"
                    value={summary}
                    onChangeText={setSummary}
                />

                <Text style={styles.label}>Текст поста</Text>
                <TextInput
                    style={[styles.input, { height: 320, textAlignVertical: 'top' }]}
                    placeholder="Введите текст поста"
                    value={body}
                    onChangeText={setBody}
                    multiline
                />

                <Text style={styles.label}>URL миниатюры (необязательно)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://example.com/image.jpg"
                    value={thumbnailUrl}
                    onChangeText={setThumbnailUrl}
                />

                {thumbnailUrl ? (
                    <View style={styles.previewContainer}>
                        <Text style={styles.previewLabel}>Превью:</Text>
                        <Image
                            source={{ uri: thumbnailUrl }}
                            style={styles.thumbnailPreview}
                            onError={() => Alert.alert('Ошибка', 'Не удалось загрузить изображение')}
                        />
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.6 }]}
                    onPress={handleCreatePost}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.buttonText}>Опубликовать</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    backButton: { marginRight: 10 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
    label: { fontSize: 14, color: '#666', marginBottom: 4, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    button: {
        flexDirection: 'row',
        backgroundColor: "#0f6219",
        marginTop: 24,
        borderRadius: 10,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    previewContainer: { marginTop: 14, alignItems: 'center' },
    previewLabel: { color: '#555', fontSize: 14, marginBottom: 6 },
    thumbnailPreview: {
        width: '100%',
        height: 180,
        borderRadius: 10,
        backgroundColor: '#eee',
    },
});

export default CreateOrPlanScreen;
