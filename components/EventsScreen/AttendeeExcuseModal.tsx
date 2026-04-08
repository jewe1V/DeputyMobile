import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, PanResponder, Dimensions, Alert
} from 'react-native';
import {useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileText, Download, User } from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Attendee {
    user_id: string;
    user_full_name: string;
    status: 'Yes' | 'No' | 'Maybe' | string;
    excuse_document_id: string | null;
    excuse_document_name: string | null;
    excuse_note: string | null;
    content_type: string;
}

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

interface AttendeeExcuseModalProps {
    visible: boolean;
    onClose: () => void;
    attendee: Attendee | null;
    onDownloadDocument: (file: {}) => void;
}

export const AttendeeExcuseModal: React.FC<AttendeeExcuseModalProps> = ({ visible, onClose, attendee, onDownloadDocument }) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const START_Y = SCREEN_HEIGHT * 0.3; // Высота модалки

    const resetPositionAnim = Animated.timing(panY, {
        toValue: START_Y,
        duration: 300,
        useNativeDriver: false,
    });

    const closeAnim = (callback?: () => void) => Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: false,
    }).start(callback);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderMove: (_, gestureState) => {
                panY.setValue(Math.max(START_Y, START_Y + gestureState.dy));
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    closeAnim(onClose);
                } else {
                    resetPositionAnim.start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            resetPositionAnim.start();
        }
        console.log(attendee);
    }, [visible]);

    if (!attendee) return null;

    const navigateToProfile = () => {
        closeAnim(() => {
            onClose();
            router.push({ pathname: '/(screens)/ProfileScreen', params: { id: attendee.user_id } });
        });
    };

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeAnim(onClose)}>
            <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={() => closeAnim(onClose)} />
                <Animated.View style={[styles.sheet, { transform: [{ translateY: panY }], paddingBottom: insets.bottom + 20 }]}>
                    <View {...panResponder.panHandlers} style={styles.dragArea}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.modalTitle}>Причина отсутствия</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Переход в профиль */}
                        <TouchableOpacity style={styles.profileLinkCard} onPress={navigateToProfile}>
                            <View style={styles.profileAvatar}>
                                <Text style={styles.profileAvatarText}>{getInitials(attendee.user_full_name)}</Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{attendee.user_full_name}</Text>
                                <Text style={styles.profileSubtitle}>Перейти в профиль</Text>
                            </View>
                            <User size={20} color="#6b7280" />
                        </TouchableOpacity>

                        {/* Причина */}
                        <Text style={styles.fieldLabel}>Комментарий:</Text>
                        <View style={styles.noteContainer}>
                            <Text style={styles.noteText}>
                                {attendee.excuse_note && attendee.excuse_note.trim().length > 0
                                    ? attendee.excuse_note
                                    : 'Причина не указана'}
                            </Text>
                        </View>

                        {/* Документ */}
                        {attendee.excuse_document_id && (
                            <View style={styles.documentSection}>
                                <Text style={styles.fieldLabel}>Прикрепленный документ:</Text>
                                <TouchableOpacity
                                    style={styles.documentPreviewCard}
                                    onPress={() => onDownloadDocument({file_name: attendee.excuse_document_name,
                                            content_type: attendee.content_type})}
                                >
                                    <View style={styles.previewContent}>
                                        <View style={styles.fileIconContainer}>
                                            <FileText size={24} color="#2A6E3F" />
                                        </View>
                                        <View style={styles.fileInfo}>
                                            <Text style={styles.documentName} numberOfLines={1}>
                                                Открыть документ
                                            </Text>
                                            <Text style={styles.fileStatus}>{attendee.excuse_document_name}</Text>
                                        </View>
                                    </View>
                                    <Download size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // Стили модалки AttendeeExcuseModal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    dismiss: { flex: 1 },
    sheet: {
        position: 'absolute', left: 0, right: 0, height: SCREEN_HEIGHT,
        backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 20, elevation: 25,
    },
    dragArea: { paddingTop: 12, paddingBottom: 4, alignItems: 'center' },
    dragIndicator: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 2.5, marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#0b2340', textAlign: 'center', marginBottom: 20 },

    profileLinkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
    profileAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    profileAvatarText: { fontSize: 16, fontWeight: '600', color: '#475569' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
    profileSubtitle: { fontSize: 13, color: '#64748b' },

    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
    noteContainer: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24 },
    noteText: { fontSize: 15, color: '#374151', lineHeight: 22 },

    documentSection: { marginTop: 4 },
    documentPreviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'space-between',
    },
    previewContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    fileIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileInfo: { marginLeft: 12, flex: 1 },
    documentName: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
    fileStatus: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
