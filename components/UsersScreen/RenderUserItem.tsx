import {Profile} from "@/models/ProfileModel";
import {Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import React from "react";
import { styles } from "./UsersListScreen";
import {router} from "expo-router";
import { useTheme } from "@/context/ThemeContext";

const getRoleStyles = (roles: string[] | null, isDark: boolean) => {
    const role = roles?.[0];
    if (isDark) {
        switch (role) {
            case 'Admin': return { bg: '#7f1d1d', text: '#fecaca', label: 'Админ' };
            case 'Deputy': return { bg: '#064e3b', text: '#dcfce7', label: 'Депутат' };
            case 'Helper': return { bg: '#0c4a6e', text: '#e0f2fe', label: 'Помощник' };
            default: return { bg: '#334155', text: '#cbd5e1', label: 'Сотрудник' };
        }
    }
    switch (role) {
        case 'Admin': return { bg: '#fee2e2', text: '#ef4444', label: 'Админ' };
        case 'Deputy': return { bg: '#dcfce7', text: '#166534', label: 'Депутат' };
        case 'Helper': return { bg: '#e0f2fe', text: '#0369a1', label: 'Помощник' };
        default: return { bg: '#f1f5f9', text: '#64748b', label: 'Сотрудник' };
    }
};

export const UserItem = ({ item }: { item: Profile }) => {
    const { colors, isDark } = useTheme();
    // @ts-ignore
    const roleStyle = getRoleStyles(item.roles, isDark);

    return (
        <TouchableOpacity
            style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/(screens)/ProfileScreen', params: { id: item.id } })}
        >
            <View style={[styles.avatar, { backgroundColor: isDark ? colors.primary + '40' : '#dcfce7' }]}>
                <Text style={[styles.avatarText, { color: isDark ? colors.roleText : '#166534' }]}>
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

            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
                    {roleStyle.label}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.subtext} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    );
};

export const renderUserItem = ({ item }: { item: Profile }) => <UserItem item={item} />;
