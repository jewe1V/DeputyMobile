import {LinearGradient} from "expo-linear-gradient";
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {ArrowLeft} from "lucide-react-native";
import React, {useCallback, useEffect, useState} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useNavigation} from "@react-navigation/native";
import {AuthManager} from "@/components/LoginScreen/LoginScreen";
import {apiUrl} from "@/api/api";
import {PhonebookModel} from "@/models/PhonebookModel";
import {Ionicons} from "@expo/vector-icons";
import {Search} from "@/components/ui/Shared/Search";
import {placeholder} from "@babel/types";

export const PhonebookScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [phonebookData, setPhonebookData] = useState<PhonebookModel>();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);


    const loadPhonebook = useCallback(async (isRefresh = false) => {
        try {
            setLoading(true);
            const token = AuthManager.getToken();

            const response = await fetch(`${apiUrl}/api/PhoneBook`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки события');
            }

            const data: PhonebookModel = await response.json();
            setPhonebookData(data);
        } catch (e) {
            console.error('Ошибка при загрузке события:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadPhonebook();
    }, [loadPhonebook]);

    if (loading) {
        return (
            <View style={[styles.container]}>
                <LinearGradient
                    colors={['#2A6E3F', '#349339']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, {paddingTop: insets.top + 15}]}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <View pointerEvents="none">
                                <ArrowLeft size={24} color="white" />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Уведомления</Text>
                        </View>
                    </View>
                </LinearGradient>
                <Search {placeholder()}/>
                <View className="Content">

                </View>
            </View>
        )
    }


    return (
        <View style={[styles.container]}>
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, {paddingTop: insets.top + 15}]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <View pointerEvents="none">
                            <ArrowLeft size={24} color="white" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Телефонная книга</Text>
                    </View>
                </View>
            </LinearGradient>
            <View className="Content">

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex: 1,

    },
    header: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 32,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        paddingHorizontal: 4,
    },
    headerTitleContainer: {
        marginRight: 12,
        marginLeft: 8,
        justifyContent: 'center',
        minHeight: 40,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 24,
        maxWidth: '100%',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 1,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    filtersSection: {
        padding: 12,
        marginTop: -24,
        borderRadius: 20,
        marginHorizontal: 15,
        backgroundColor: "rgb(250,254,250)",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
    },
    filtersGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    filterGroup: {
        flex: 1,
    },
    filterLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        marginLeft: 2,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        // Копируем стили из selectTrigger:
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee', // или тот цвет, что в вашем селекте
        paddingHorizontal: 12,
        height: 36, // Фиксированная высота как у триггера
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b', // Темный цвет текста как в селекте
        fontWeight: '400', // Средний вес
        paddingVertical: 0, // Убираем внутренние отступы Android
    },
})
