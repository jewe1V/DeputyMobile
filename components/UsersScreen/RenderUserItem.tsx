import {Profile} from "@/models/ProfileModel";
import {Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import React from "react";
import { styles } from "./UsersListScreen";
import {router} from "expo-router";

const getRoleStyles = (roles: string[] | null) => {
    const role = roles?.[0];
    switch (role) {
        case 'Admin': return { bg: '#fee2e2', text: '#ef4444', label: 'Админ' };
        case 'Deputy': return { bg: '#dcfce7', text: '#166534', label: 'Депутат' };
        case 'Helper': return { bg: '#e0f2fe', text: '#0369a1', label: 'Помощник' };
        default: return { bg: '#f1f5f9', text: '#64748b', label: 'Сотрудник' };
    }
};

export const renderUserItem = ({ item }: { item: Profile }) => {
    // @ts-ignore
    const roleStyle = getRoleStyles(item.roles);

    return (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => router.push({ pathname: '/(screens)/ProfileScreen', params: { id: item.id } })}
        >
            <View style={[styles.avatar, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.avatarText}>
                    {(item.full_name || item.email || '?').charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                    {item.full_name || 'Без имени'}
                </Text>
                <Text style={styles.jobText} numberOfLines={1}>
                    {item.job_title || item.email}
                </Text>
            </View>

            <View style={[styles.roleBadge, { backgroundColor: "#f1f5f9" }]}>
                <Text style={[styles.roleBadgeText, { color: "#64748b" }]}>
                    {roleStyle.label}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    );
};
