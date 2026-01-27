import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Animated,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from "@/components/Header";
import {apiUrl} from "@/api/api";
import { styles } from './style';

// Тип данных каталога
export interface Catalog {
    id: string;
    name: string;
    parentCatalogId?: string | null;
    parentCatalog?: string;
    ownerId?: string;
    owner?: string;
    children?: string[];
    documents?: string[];
}

const CatalogScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
    const [catalogName, setCatalogName] = useState('');
    const [currentCatalogId, setCurrentCatalogId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Загрузка токена из AsyncStorage
    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('authToken');
                setToken(storedToken);
            } catch (error) {
                console.error('Error loading token:', error);
            }
        };
        loadToken();
    }, []);

    // Загрузка каталогов
    useEffect(() => {
        if (token) {
            fetchCatalogs();
        }
    }, [token, currentCatalogId]);

    const fetchCatalogs = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/Catalogs/my`, {
                method: 'GET',
                headers: {
                    'accept': 'text/plain',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Фильтруем каталоги по parentCatalogId
                const filteredCatalogs = currentCatalogId
                    ? data.filter((c: Catalog) => c.parentCatalogId === currentCatalogId)
                    : data.filter((c: Catalog) => !c.parentCatalogId);
                setCatalogs(filteredCatalogs);
            } else {
                Alert.alert('Ошибка', 'Не удалось загрузить каталоги');
            }
        } catch (error) {
            console.error('Error fetching catalogs:', error);
            Alert.alert('Ошибка', 'Произошла ошибка при загрузке каталогов');
        }
    };

    const openCreateModal = () => {
        setEditingCatalog(null);
        setCatalogName('');
        setModalVisible(true);
    };

    const openEditModal = (catalog: Catalog) => {
        setEditingCatalog(catalog);
        setCatalogName(catalog.name);
        setModalVisible(true);
    };

    const saveCatalog = async () => {
        if (catalogName.trim() === '') {
            Alert.alert('Ошибка', 'Название каталога не может быть пустым');
            return;
        }

        try {
            if (editingCatalog) {
                // Редактирование каталога (предполагаемый PUT запрос)
                const response = await fetch(`${apiUrl}/api/Catalogs/${editingCatalog.id}`, {
                    method: 'PUT',
                    headers: {
                        'accept': 'text/plain',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        NewName: catalogName,

                    }),
                });

                if (response.ok) {
                    await fetchCatalogs();
                    setModalVisible(false);
                } else {
                    Alert.alert('Ошибка', 'Не удалось обновить каталог');
                }
            } else {
                const url = `${apiUrl}/api/Catalogs`;
                const body: any = { name: catalogName };
                if (currentCatalogId) {
                    body.parentCatalogId = currentCatalogId;
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'accept': 'text/plain',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    await fetchCatalogs();
                    setModalVisible(false);
                } else {
                    Alert.alert('Ошибка', 'Не удалось создать каталог');
                }
            }
        } catch (error) {
            console.error('Error saving catalog:', error);
            Alert.alert('Ошибка', 'Произошла ошибка при сохранении каталога');
        }
    };

    const deleteCatalog = async (catalog: Catalog) => {
        Alert.alert(
            'Удаление каталога',
            `Вы действительно хотите удалить каталог "${catalog.name}"?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${apiUrl}/api/Catalogs/${catalog.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'accept': '*/*',
                                    'Authorization': `Bearer ${token}`,
                                },
                            });
                            if (response.ok) {
                                await fetchCatalogs();
                            } else {
                                Alert.alert('Ошибка', 'Не удалось удалить каталог');
                            }
                        } catch (error) {
                            console.error('Error deleting catalog:', error);
                            Alert.alert('Ошибка', 'Произошла ошибка при удалении каталога');
                        }
                    },
                },
            ]
        );
    };

    const openCatalog = async (catalog: Catalog) => {
        setCurrentCatalogId(catalog.id);
    };

    const goBack = () => {
        if (currentCatalogId) {
            // Находим текущий каталог, чтобы получить его parentCatalogId
            const currentCatalog = catalogs.find(c => c.id === currentCatalogId);
            setCurrentCatalogId(currentCatalog?.parentCatalogId || null);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Header title={'Каталоги документов'} isUserButton={false} />
                <View style={styles.headerActions}>
                    {currentCatalogId && (
                        <TouchableOpacity style={styles.backButton} onPress={goBack}>
                            <Ionicons name="arrow-back" size={24} color="#0a58ff" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={catalogs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <CatalogItem
                        item={item}
                        index={index}
                        onEdit={openEditModal}
                        onDelete={deleteCatalog}
                        onOpen={openCatalog}
                    />
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Каталогов пока нет</Text>
                }
            />

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingCatalog ? 'Редактировать каталог' : 'Новый каталог'}
                        </Text>
                        <TextInput
                            placeholder="Название каталога"
                            value={catalogName}
                            onChangeText={setCatalogName}
                            style={styles.input}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalCancel]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalBtnText}>Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalSave]}
                                onPress={saveCatalog}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Сохранить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Компонент CatalogItem
interface CatalogItemProps {
    item: Catalog;
    index: number;
    onEdit: (item: Catalog) => void;
    onDelete: (item: Catalog) => void;
    onOpen: (item: Catalog) => void;
}

const CatalogItem: React.FC<CatalogItemProps> = ({ item, index, onEdit, onDelete, onOpen }) => {
    const translateAnim = new Animated.Value(30);
    const opacityAnim = new Animated.Value(0);

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(translateAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 70,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 70,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.card,
                { transform: [{ translateY: translateAnim }], opacity: opacityAnim },
            ]}
        >
            <TouchableOpacity style={styles.cardContent} onPress={() => onOpen(item)}>
                <Ionicons name="folder" size={28} color="#0a58ff" style={{ marginRight: 12 }} />
                <Text style={styles.cardTitle}>{item.name}</Text>
            </TouchableOpacity>

            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => onEdit(item)}>
                    <Ionicons name="create-outline" size={22} color="#4b5563" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item)} style={{ marginLeft: 12 }}>
                    <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

export default CatalogScreen;
