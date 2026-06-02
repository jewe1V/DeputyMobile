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
    const renderItem = ({ item }: { item: Profile }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => onAdd(item.id)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {(item.full_name || item.email || '?').charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.full_name || 'Без имени'}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>

            <Ionicons name="add-circle-outline" size={26} color="#2A6E3F" />
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
                        <Ionicons name="people-outline" size={48} color="#94a3b8" />
                        <Text style={styles.emptyText}>Нет доступных пользователей</Text>
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
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#2A6E3F" />
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