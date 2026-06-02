import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Download, User, X } from 'lucide-react-native';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal/BottomSheetModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiUrl, xAppSecret } from '@/api/api';
import { AuthManager } from '@/components/LoginScreen/LoginScreen';
import {ImagePreviewModal} from "@/components/EventsScreen/ImagePreviewModal";
import { useTheme } from '@/context/ThemeContext';

// Компонент для загрузки изображения с авторизацией на вебе
const AuthImage: React.FC<{ fileName: string; style: any; onPress?: () => void }> = ({ fileName, style, onPress }) => {
    const { colors, isDark } = useTheme();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let objectUrl: string | null = null;

        const loadImage = async () => {
            try {
                setLoading(true);
                const token = AuthManager.getToken();
                const encodedName = encodeURIComponent(fileName);
                const response = await fetch(`${apiUrl}/api/files/${encodedName}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-App-Secret': xAppSecret
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const blob = await response.blob();
                objectUrl = URL.createObjectURL(blob);
                setImageUrl(objectUrl);
            } catch (error) {
                console.error('Error loading image:', error);
                setImageUrl(null);
            } finally {
                setLoading(false);
            }
        };

        loadImage();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [fileName]);

    const ImageComponent = (
        <View style={style}>
            {loading && <View style={[style, { backgroundColor: isDark ? colors.iconBox : '#e5e7eb' }]} />}
            {imageUrl && (
                <Image
                    source={{ uri: imageUrl }}
                    style={style}
                    resizeMode="cover"
                />
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} style={style}>
                {ImageComponent}
            </TouchableOpacity>
        );
    }

    return ImageComponent;
};

interface Attendee {
    user_id: string;
    user_full_name: string;
    status: 'Yes' | 'No' | 'Maybe' | string;
    excuse_document_id: string | null;
    excuse_document_name: string | null;
    excuse_note: string | null;
    content_type: string;
    file_name_encoded?: string;
}

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const isImageFile = (content_type: string | null) => {
    if (!content_type) return false;
    const ext = content_type.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'heic', 'webp', 'gif', 'bmp'].includes(ext || '');
};

interface Props {
    visible: boolean;
    onClose: () => void;
    attendee: Attendee | null;
    onDownloadDocument: (file: { file_name: string | null; content_type: string; file_name_encoded?: string }) => void;
}

export const AttendeeExcuseModal: React.FC<Props> = ({
                                                         visible,
                                                         onClose,
                                                         attendee,
                                                         onDownloadDocument,
                                                     }) => {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

    if (!attendee) return null;

    const navigateToProfile = () => {
        onClose();
        router.push({
            pathname: '/(screens)/ProfileScreen',
            params: { id: attendee.user_id },
        });
    };

    const isImage = isImageFile(attendee.content_type);

    const handleImagePress = () => {
        if (isImage && attendee.excuse_document_name) {
            setIsFullscreenPreview(true);
        }
    };

    const handleDocumentPress = () => {
        if (isImage && attendee.excuse_document_name) {
            setIsFullscreenPreview(true);
        } else {
            onDownloadDocument({
                file_name: attendee.excuse_document_name,
                content_type: attendee.content_type,
                file_name_encoded: attendee.file_name_encoded,
            });
        }
    };

    return (
        <>
            <BottomSheetModal
                visible={visible}
                onClose={onClose}
                title="Причина отсутствия"
                heightFraction={0.55}
                scrollEnabled={true}
            >
                {/* Блок профиля */}
                <TouchableOpacity style={[styles.profileLinkCard, { backgroundColor: isDark ? colors.iconBox : '#f8fafc', borderColor: colors.border }]} onPress={navigateToProfile}>
                    <View style={[styles.profileAvatar, { backgroundColor: isDark ? colors.background : '#e2e8f0' }]}>
                        <Text style={[styles.profileAvatarText, { color: colors.text }]}>
                            {getInitials(attendee.user_full_name)}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>{attendee.user_full_name}</Text>
                        <Text style={[styles.profileSubtitle, { color: colors.subtext }]}>Перейти в профиль</Text>
                    </View>
                    <User size={20} color={colors.subtext} />
                </TouchableOpacity>

                {/* Комментарий */}
                <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Комментарий:</Text>
                <View style={[styles.noteContainer, { backgroundColor: isDark ? colors.iconBox : '#F9FAFB', borderColor: colors.border }]}>
                    <Text style={[styles.noteText, { color: colors.text }]}>
                        {attendee.excuse_note?.trim()
                            ? attendee.excuse_note
                            : 'Причина не указана'}
                    </Text>
                </View>

                {/* Документ */}
                {attendee.excuse_document_id && (
                    <View style={styles.documentSection}>
                        <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Прикрепленный документ:</Text>
                        <TouchableOpacity
                            style={[styles.documentPreviewCard, { backgroundColor: isDark ? colors.iconBox : '#F3F4F6' }]}
                            onPress={handleDocumentPress}
                        >
                            <View style={styles.previewContent}>
                                {isImage && attendee.excuse_document_name ? (
                                    <AuthImage
                                        fileName={attendee.excuse_document_name}
                                        style={styles.thumbnail}
                                        onPress={handleImagePress}
                                    />
                                ) : (
                                    <View style={[styles.fileIconContainer, { backgroundColor: isDark ? colors.primary + '20' : '#D1FAE5' }]}>
                                        <FileText size={24} color={isDark ? colors.roleText : "#2A6E3F"} />
                                    </View>
                                )}
                                <View style={styles.fileInfo}>
                                    <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
                                        {isImage ? 'Просмотреть изображение' : 'Открыть документ'}
                                    </Text>
                                    <Text style={[styles.fileStatus, { color: colors.subtext }]}>
                                        {attendee.excuse_document_name}
                                    </Text>
                                </View>
                            </View>
                            {!isImage && <Download size={20} color={colors.subtext} />}
                        </TouchableOpacity>
                    </View>
                )}
            </BottomSheetModal>

            <ImagePreviewModal
                visible={isFullscreenPreview}
                onClose={() => setIsFullscreenPreview(false)}
                fileName={attendee.excuse_document_name}
                onDownload={() => onDownloadDocument({
                    file_name: attendee.excuse_document_name,
                    content_type: attendee.content_type,
                    file_name_encoded: attendee.file_name_encoded,
                })}
            />

        </>
    );
};

const styles = StyleSheet.create({
    profileLinkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    profileAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileAvatarText: { fontSize: 16, fontWeight: '600', color: '#475569' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
    profileSubtitle: { fontSize: 13, color: '#64748b' },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    noteContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    noteText: { fontSize: 15, color: '#374151', lineHeight: 22 },
    documentSection: { marginTop: 4 },
    documentPreviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 8,
        justifyContent: 'space-between',
    },
    previewContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    fileIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileInfo: { marginLeft: 12, flex: 1 },
    documentName: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
    fileStatus: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    downloadIconContainer: {
        marginLeft: 8,
    },
    fullScreenOverlay: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closePreviewButton: {
        position: 'absolute',
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 5,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    previewFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 20,
        alignItems: 'center',
        gap: 12,
    },
    previewFooterText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2A6E3F',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
    },
    downloadButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
