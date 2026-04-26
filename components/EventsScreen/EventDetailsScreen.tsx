import React, { useCallback, useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Modal, Alert, Platform, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, FileText, Download, CheckCircle2, XCircle, HelpCircle, X, Edit, Trash2 } from "lucide-react-native";
import { EventAttachmentUploader } from "@/components/EventsScreen/EventAttachmentUploader";
import { EventAttendanceModal } from "@/components/EventsScreen/EventAttendanceModal";
import { useFileManagerPresenter } from "@/components/FileManagerScreen/FileManagerPresenter";
import { formatDateTime } from "@/utils";
import { AttendeeExcuseModal } from "@/components/EventsScreen/AttendeeExcuseModal";
import Toast from "react-native-toast-message";
// @ts-ignore
import { EventMap } from "@/components/ui/EventMap/EventMap";
import {showLocation} from "react-native-map-link";
import {apiClient, apiUrl, xAppSecret} from '@/api/api';


interface Attachment {
    id: string;
    document_id: string;
    file_name: string;
    url: string;
    description: string | null;
}

interface Attendee {
    user_id: string;
    user_full_name: string;
    status: 'Yes' | 'No' | 'Maybe' | string;
    excuse_document_id: string | null;
    excuse_document_name: string | null;
    excuse_note: string | null;
}

interface EventData {
    id: string;
    author_id: string;
    title: string;
    type: string;
    description: string;
    start_at: string;
    end_at: string;
    location: string;
    is_public: boolean;
    organizer?: string;
    created_at?: string;
    attachments: Attachment[];
    attendees: Attendee[];
}

interface AttachmentItemProps {
    file: Attachment;
    onImagePress: (url: string) => void;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({ file, onImagePress }) => {
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const token = AuthManager.getToken();
    const { handlers } = useFileManagerPresenter();
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
    const isAdmin = AuthManager.getRole() === "Admin";
    const userId = AuthManager.getUserId();
    const imageHeaders = {
        Authorization: `Bearer ${token}`,
        ...({ 'X-App-Secret': xAppSecret })
    };

    const handleDownload = React.useCallback(() => {
        // @ts-ignore
        handlers.handleDownloadDocument(file);
    }, [handlers, file]);

    return (
        <View style={styles.attachmentContainer}>
            {isImage ? (
                <TouchableOpacity
                    style={styles.imagePreviewContainer}
                    onPress={handleDownload}
                >
                    <Image
                        source={{
                            uri: `${apiUrl}/api/files/${encodeURIComponent(file.file_name)}`,
                            headers: imageHeaders
                        }}
                        style={styles.imagePreview}
                    />
                    <View style={styles.imagePreviewOverlay}>
                        <Text style={styles.imagePreviewName} numberOfLines={1}>{file.file_name}</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.fileRow, isDownloading && styles.fileRowDownloading]}
                    onPress={handleDownload}
                    disabled={isDownloading}
                >
                    <View style={styles.fileIconContainer}>
                        <FileText size={20} color="#0f6319" />
                    </View>
                    <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                        {file.file_name}
                    </Text>
                    {isDownloading ? (
                        <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
                    ) : (
                        <Download size={20} color="#6b7280" />
                    )}
                </TouchableOpacity>
            )}

            {isDownloading && (
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
                </View>
            )}
        </View>
    );
};

const EventDetailsScreen: React.FC = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<EventData | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();
    const [showUploader, setShowUploader] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const { handlers } = useFileManagerPresenter();
    const router = useRouter();
    const [excuseModalVisible, setExcuseModalVisible] = useState(false);
    const [selectedExcuseAttendee, setSelectedExcuseAttendee] = useState<Attendee | null>(null);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [selectedImageName, setSelectedImageName] = useState<string | null>(null);

    const userRole = AuthManager.getRole();
    const userId = AuthManager.getUserId();

    const handleImagePress = (url: string, name: string) => {
        setSelectedImageUrl(url);
        setSelectedImageName(name);
        setViewerVisible(true);
    };

    const handleBack = () => {
        router.replace('/EventsScreen');
    };

    const loadEvent = useCallback(async (isRefresh = false) => {
        try {
            const { data } = await apiClient.get<EventData>(`/api/Events/${id}`);
            setEvent(data);
        } catch (e) {
            console.error('Ошибка при загрузке события:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        loadEvent();
    }, [loadEvent]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadEvent(true);
    }, [loadEvent]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0f6319" />
                <Text style={styles.loadingText}>Загрузка события...</Text>
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#dc2626" />
                <Text style={styles.errorText}>Событие не найдено</Text>
                <TouchableOpacity style={styles.errorButton} onPress={handleBack}>
                    <Text style={styles.errorButtonText}>Вернуться назад</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const parseLocation = (locationString: string) => {
        if (!locationString) return { address: '', coordinates: null };
        const parts = locationString.split('|');
        if (parts.length === 2) {
            const [address, coords] = parts;
            const [lat, lon] = coords.split(',').map(Number);
            return { address: address.trim(), coordinates: { lat, lon } };
        }
        return { address: locationString, coordinates: null };
    };

    const location = parseLocation(event.location);
    const startDate = formatDateTime(event.start_at);
    const endDate = formatDateTime(event.end_at);

    const getEventTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            Event: 'Мероприятие',
            Meeting: 'Заседание',
            Commission: 'Комиссия'
        };
        return types[type] || type;
    };

    const openMaps = () => {
        // Условие для веб-платформы: открываем обычную ссылку в браузере
        if (Platform.OS === 'web') {
            if (location.coordinates) {
                window.open(`https://yandex.ru/maps/?pt=${location.coordinates.lon},${location.coordinates.lat}&z=16`, '_blank');
            } else if (location.address) {
                window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(location.address)}`, '_blank');
            }
            return;
        }

        // Логика для нативных приложений
        const locationParams = {
            title: location.address,
            dialogTitle: 'Открыть в навигаторе',
            dialogMessage: 'Выберите приложение для построения маршрута',
            cancelText: 'Отмена',
        };

        if (location.coordinates) {
            const { lat, lon } = location.coordinates;
            showLocation({
                ...locationParams,
                latitude: lat,
                longitude: lon,
                appsWhiteList: ['yandex-maps', 'dgis', 'apple-maps']
            });
        }
        else if (location.address) {
            showLocation({
                ...locationParams,
                address: location.address
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Yes': return <CheckCircle2 size={18} color="#0f6319" />;
            case 'No': return <XCircle size={18} color="#dc2626" />;
            default: return <HelpCircle size={18} color="#6b7280" />;
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Вы уверены, что хотите удалить событие?')) {
                executeDelete();
            }
            return;
        }

        Alert.alert('Удаление', 'Вы уверены?', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить',
                style: 'destructive',
                onPress: executeDelete
            },
        ]);
    };

    const executeDelete = async () => {
        try {
            await apiClient.delete(`/api/Events/${id}`);

            Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Событие успешно удалено',
                position: 'top',
                visibilityTime: 3000,
            });
            router.push("/(screens)/EventsScreen");
        } catch (error: any) {
            console.error('Delete error:', error);

            const errorMessage = error.response?.data?.message || error.message || 'Произошла неизвестная ошибка';
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: errorMessage,
                position: 'bottom',
                visibilityTime: 4000,
            });
        }
    };

    return (
        <>
            <ScrollView
                style={[styles.container, { backgroundColor: '#f8fafc' }]}
                contentContainerStyle={{ paddingBottom: insets.bottom + 50 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={['#2A6E3F', '#349339']}
                    style={[styles.header, { paddingTop: insets.top + 15 }]}
                >
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <View pointerEvents="none">
                                <ArrowLeft size={24} color="white" />
                            </View>
                        </TouchableOpacity>

                        {(userRole === "Admin" || userId === event.id) && (
                            <View style={styles.headerActions}>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => router.push({ pathname: '/(screens)/EventsScreen/CreateEventScreen', params: { id: event.id, isEdit: 1 } })}
                                >
                                    <Edit size={20} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.iconButton, { marginLeft: 10 }]} onPress={handleDelete}>
                                    <Trash2 size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle} numberOfLines={3}>{event.title}</Text>
                        <View style={[styles.statusTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={[styles.statusTagText, { color: 'white' }]}>{getEventTypeLabel(event.type)}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.timeRow}>
                            <View style={styles.timeContent}>
                                <Text style={styles.label}>Начало</Text>
                                <Text style={styles.value}>{startDate.day}, {startDate.time}</Text>
                            </View>
                            <View style={styles.timeDividerVertical} />
                            <View style={styles.timeContent}>
                                <Text style={styles.label}>Окончание</Text>
                                <Text style={styles.value}>{endDate.day}, {endDate.time}</Text>
                            </View>
                        </View>
                    </View>

                    {location.coordinates && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Место проведения</Text>
                            <Text style={styles.addressText}>{location.address}</Text>
                            <TouchableOpacity onPress={openMaps} activeOpacity={0.9}>
                                <View style={styles.mapContainer}>
                                    <EventMap coordinates={location.coordinates} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {event.description && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>О событии</Text>
                            <Text style={styles.description}>{event.description}</Text>
                        </View>
                    )}

                    {event.attachments && event.attachments.length > 0 && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Материалы</Text>
                            {event.attachments.map((file) => (
                                <AttachmentItem
                                    key={file.id}
                                    file={file}
                                    onImagePress={() => handleImagePress(`${apiUrl}/api/files/${encodeURIComponent(file.file_name)}`, file.file_name)}
                                />
                            ))}
                        </View>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Участники ({event.attendees.filter(attendee => attendee.status === 'Yes').length})</Text>
                            {event.attendees.map((attendee) => (
                                <TouchableOpacity
                                    key={attendee.user_id}
                                    style={styles.attendeeRow}
                                    onPress={() => {
                                        if (attendee.status === 'No') {
                                            setSelectedExcuseAttendee(attendee);
                                            setExcuseModalVisible(true);
                                        } else {
                                            router.push({ pathname: '/(screens)/ProfileScreen', params: { id: attendee.user_id } });
                                        }
                                    }}
                                >
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{getInitials(attendee.user_full_name)}</Text>
                                    </View>
                                    <View style={styles.attendeeInfo}>
                                        <Text style={styles.attendeeName}>{attendee.user_full_name}</Text>
                                        <View style={styles.statusBadge}>
                                            {getStatusIcon(attendee.status)}
                                            <Text style={styles.statusText}>
                                                {attendee.status === 'Yes' ? 'Подтвердил' : attendee.status === 'No' ? 'Отклонил' : 'Под вопросом'}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.metaCard}>
                        <View style={styles.metaRow}>
                            <Ionicons name="lock-open-outline" size={18} color="#6b7280" />
                            <Text style={styles.metaLabel}>
                                {event.is_public ? 'Публичное событие' : 'Приватное событие'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.actionGroup}>
                        { (userRole === "Admin" || userId === event.author_id ) &&
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowUploader(true)}>
                                <FileText size={20} color="#0f6319" />
                                <Text style={styles.secondaryButtonText}>Прикрепить файл</Text>
                            </TouchableOpacity>

                        }


                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowAttendanceModal(true)}>
                            <CheckCircle2 size={20} color="#0f6319" />
                            <Text style={styles.secondaryButtonText}>Отметить участие</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>

            <EventAttachmentUploader
                eventId={id}
                visible={showUploader}
                onClose={() => setShowUploader(false)}
                onSuccess={loadEvent}
            />
            <EventAttendanceModal
                eventId={id}
                visible={showAttendanceModal}
                onClose={() => setShowAttendanceModal(false)}
                onSuccess={loadEvent}
            />
            <AttendeeExcuseModal
                visible={excuseModalVisible}
                onClose={() => setExcuseModalVisible(false)}
                attendee={selectedExcuseAttendee}
                onDownloadDocument={handlers.handleDownloadDocument}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#6b7280' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 24 },
    errorText: { marginTop: 16, fontSize: 18, color: '#1e293b', textAlign: 'center' },
    errorButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0f6319', borderRadius: 8 },
    errorButtonText: { color: '#fff', fontSize: 16 },
    header: { paddingHorizontal: 20, paddingBottom: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    headerActions: { flexDirection: 'row' },
    iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 },
    statusTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    statusTagText: { fontSize: 12, fontWeight: '600' },
    content: { padding: 16, marginTop: -55 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timeContent: { flex: 1 },
    timeDividerVertical: { width: 1, height: '100%', backgroundColor: '#e5e7eb', marginHorizontal: 16 },
    label: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
    value: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    addressText: { fontSize: 14, color: '#4b5563', marginBottom: 12 },
    mapContainer: { borderRadius: 12, overflow: 'hidden', height: 160 },
    map: { width: '100%', height: '100%' },
    description: { fontSize: 15, color: '#4b5563', lineHeight: 22 },

    fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 8 },
    fileIconContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    fileName: { flex: 1, fontSize: 14, color: '#1e293b', marginRight: 12 },

    attendeeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 14, fontWeight: '600', color: '#475569' },
    attendeeInfo: { flex: 1 },
    attendeeName: { fontSize: 15, fontWeight: '500', color: '#1e293b', marginBottom: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: 13, color: '#64748b', marginLeft: 6 },

    metaCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaLabel: { fontSize: 14, color: '#6b7280', marginLeft: 10 },

    actionGroup: { gap: 12, marginBottom: 20 },
    secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    secondaryButtonText: { fontSize: 15, fontWeight: '600', color: '#0f6319', marginLeft: 8 },
    attachmentContainer: { marginBottom: 12 },
    imagePreviewContainer: { height: 120, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1f5f9' },
    imagePreview: { width: '100%', height: '100%' },
    imagePreviewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center', justifyContent: 'space-between' },
    imagePreviewName: { color: '#fff', fontSize: 12, flex: 1, marginRight: 8 },
    downloadIconButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
    fileRowDownloading: { opacity: 0.8 },
    progressText: { fontSize: 12, fontWeight: '600', color: '#0f6319' },
    progressBarBackground: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#0f6319', borderRadius: 2 },
    imageViewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    imageViewerCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
    fullScreenImage: { width: '100%', height: '80%' },
    fullScreenOverlay: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
    closePreviewButton: { position: 'absolute', right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 5 },
    fullImage: { width: '100%', height: '80%' },
    previewFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 20, alignItems: 'center' },
    previewFooterText: { color: 'white', fontSize: 16, fontWeight: '500' },
});

export default EventDetailsScreen;
