import { Text, TextInput, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface SearchProps {
    placeholder: string;
    searchQuery: string;
    onChangeText: (text: string) => void;
}

export const Search = ({ placeholder, searchQuery, onChangeText }: SearchProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Поиск</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={onChangeText}
                        />
                        <Ionicons name="search" size={16} color="#6B7280" />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
    wrapper: {
        flexDirection: 'row',
        gap: 8,
    },
    inputContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        marginLeft: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        paddingHorizontal: 12,
        height: 36,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '400',
        paddingVertical: 0,
    },
});
