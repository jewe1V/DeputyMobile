import {Profile} from "@/models/ProfileModel";
import {Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import React from "react";
import { styles } from "./UsersListScreen";
import {router} from "expo-router";
import { useTheme } from "@/context/ThemeContext";

const getRoleLabel = (roles: string[] | null) => {
    const role = roles?.[0];
    switch (role) {
        case 'Admin': return 'Админ';
        case 'Deputy': return 'Депутат';
        case 'Helper': return 'Помощник';
        default: return 'Сотрудник';
    }
};

export const UserItem = ({ item }: { item: Profile }) => {
    const { colors, isDark } = useTheme();
    const roleLabel = getRoleLabel(item.roles);

    return (
        <TouchableOpacity
            style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/(screens)/ProfileScreen', params: { id: item.id } })}
        >
            <View style={[styles.avatar, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                <Text style={[styles.avatarText, { color: isDark ? '#f1f5f9' : '#475569' }]}>
                    {(item.full_name || item.email || '?').charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                    {item.full_name || 'Без имени'}
                </Text>
                <Text style={[styles.jobText, { color: colors.subtext }]} numberOfLines={1}>
                    {item.job_title || item.email}
                </Text>
            </View>

            <View style={[styles.roleBadge, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <Text style={[styles.roleBadgeText, { color: colors.subtext }]}>
                    {roleLabel}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.subtext} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    );
};

export const renderUserItem = ({ item }: { item: Profile }) => <UserItem item={item} />;
