import { Text, TextInput, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

interface SearchProps {
    placeholder: string;
    searchQuery: string;
    onChangeText: (text: string) => void;
}

export const Search = ({ placeholder, searchQuery, onChangeText }: SearchProps) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.05 }]}>
            <View style={styles.wrapper}>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.subtext }]}>Поиск</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#ffffff', borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder={placeholder}
                            placeholderTextColor={colors.subtext}
                            value={searchQuery}
                            onChangeText={onChangeText}
                        />
                        <Ionicons name="search" size={16} color={colors.subtext} />
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
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
        marginBottom: 4,
        marginLeft: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
        height: 36,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '400',
        paddingVertical: 0,
    },
});
