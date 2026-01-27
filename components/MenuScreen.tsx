import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Header} from "@/components/Header";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import React from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";

const MenuScreen = () => {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.menuContainer, { paddingTop: insets.top }]}>
            <Header title={'Выберите действие'} isUserButton={false}/>
            <View style={styles.postCardContainer}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => router.push('/(screens)/CreateEventScreen')}
                >
                    <Ionicons name="calendar-outline" size={22} color="#0f6219" />
                    <Text style={styles.menuButtonText}>Планирование</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuButton, { backgroundColor: '#0f6219' }]}
                    onPress={() => router.push('/(screens)/CreatePostScreen')}
                >
                    <Ionicons name="create-outline" size={22} color="#fff" />
                    <Text style={[styles.menuButtonText, {color: '#fff'}]}>Публикация</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    menuContainer: {
        flex: 1,
        backgroundColor: '#f1f2f4',
        paddingHorizontal: 16,
    },
    postCardContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    menuTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 30,
        color: '#333',
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        backgroundColor: '#fff',
        borderColor: '#0f6219',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginVertical: 10,
        width: '100%',
        justifyContent: 'center',
    },
    menuButtonText: {
        color: '#0f6319',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
})

export default MenuScreen;
