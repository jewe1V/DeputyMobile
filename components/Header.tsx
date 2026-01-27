import {Image, StyleSheet, Text, TouchableOpacity, View, Alert} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen, AuthTokenManager} from './LoginScreen/LoginScreen';

interface HeaderProps {
    title?: string;
    subTitle?: string;
    isUserButton?: boolean;
}

interface UserData {
    id: string;
    email: string;
    fullName: string;
    jobTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
                                                  title = "Деятельность депутата",
                                                  subTitle = "Екатеринбургская городская Дума",
                                                    isUserButton = true,
                                              }) => {
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);

    // Проверяем статус авторизации при загрузке компонента
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const userDataString = await AsyncStorage.getItem('userData');

            if (token && userDataString) {
                const user: UserData = JSON.parse(userDataString);
                setIsAuthenticated(true);
                setUserData(user);
            } else {
                setIsAuthenticated(false);
                setUserData(null);
            }
        } catch (error) {
            console.error('Ошибка проверки статуса авторизации:', error);
            setIsAuthenticated(false);
            setUserData(null);
        }
    };

    const handleAuthButtonPress = () => {
        if (isAuthenticated) {
            // Если авторизован - показываем меню выхода
            showLogoutAlert();
        } else {
            // Если не авторизован - открываем модалку входа
            setIsLoginModalVisible(true);
        }
    };

    const showLogoutAlert = () => {
        handleLogout();
    };

    const handleLogout = async () => {
        await AuthTokenManager.clearToken();
        setIsAuthenticated(false);
        setUserData(null);
    };

    const handleLoginSuccess = () => {
        checkAuthStatus(); // Обновляем статус авторизации
        setIsLoginModalVisible(false);
    };

    const handleCloseModal = () => {
        setIsLoginModalVisible(false);
    };

    return (
        <>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        resizeMode="contain"
                        source={require('@/assets/images/ekb-emblem.png')}
                        style={styles.emblem}
                    />
                    <View>
                        <Text style={styles.hTitle}>{title}</Text>
                        <Text style={styles.hSub}>{subTitle}</Text>
                    </View>
                </View>

                {isUserButton && (<TouchableOpacity
                    style={[
                        styles.headerDot,
                        isAuthenticated && styles.authenticatedButton
                    ]}
                    onPress={handleAuthButtonPress}
                >
                    <Ionicons
                        name={isAuthenticated ? "log-in-outline" : "person-outline"}
                        size={20}
                        color={isAuthenticated ? "#f64252" : "#6b7280"}
                    />
                </TouchableOpacity>)}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        marginTop: 12,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    emblem: {
        width: 52,
        height: 52,
        marginRight: 12
    },
    hTitle: {
        fontSize: 20,
        fontFamily: 'Inter_600SemiBold',
        color: '#000000'
    },
    hSub: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'Inter_400Regular'
    },
    headerDot: {
        padding: 7,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    authenticatedButton: {
        borderColor: '#f64252',
        backgroundColor: '#f0f7ff',
    },
});
