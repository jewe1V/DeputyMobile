import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from "@/models/ProfileModel";
import { BottomSheetModal as ModalBottomSheet } from '@/components/ui/BottomSheetModal/BottomSheetModal';
import { useTheme } from '@/context/ThemeContext';

interface AddUserPopupProps {
    visible: boolean;
    onClose: () => void;
    availableUsers: Profile[];
    onAdd: (userId: string) => void;
    loading: boolean;
}

export const AddUserPopup: React.FC<AddUserPopupProps> = ({
                                                              visible,
                                                              onClose,
                                                              availableUsers,
                                                              onAdd,
                                                              loading
                                                          }) => {
    const { colors, isDark } = useTheme();
    const renderItem = ({ item }: { item: Profile }) => (
        <TouchableOpacity
            style={[styles.userCard, { borderBottomColor: colors.divider }]}
            onPress={() => onAdd(item.id)}
        >
            <View style={[styles.avatar, { backgroundColor: isDark ? colors.primary + '20' : '#ebfdeb' }]}>
                <Text style={[styles.avatarText, { color: isDark ? colors.roleText : '#2A6E3F' }]}>
                    {(item.full_name || item.email || '?').charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{item.full_name || 'Без имени'}</Text>
                <Text style={[styles.userEmail, { color: colors.subtext }]}>{item.email}</Text>
            </View>

            <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
    );

    return (
        <ModalBottomSheet
            visible={visible}
            onClose={onClose}
            title="Добавить сотрудника"
            heightFraction={0.8}
            scrollEnabled={true}
            sheetStyle={styles.sheetOverride}
        >
            <View style={styles.content}>
                {availableUsers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color={colors.subtext} />
                        <Text style={[styles.emptyText, { color: colors.subtext }]}>Нет доступных пользователей</Text>
                    </View>
                ) : (
                    <FlatList
                        data={availableUsers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {loading && (
                    <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )}
            </View>
        </ModalBottomSheet>
    );
};

const styles = StyleSheet.create({
    sheetOverride: {
        paddingHorizontal: 0,
    },
    content: {
        flex: 1,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ebfdeb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#2A6E3F',
        fontWeight: '700',
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    userEmail: {
        fontSize: 13,
        color: '#64748b',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
        paddingHorizontal: 20,
    },
    emptyText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});