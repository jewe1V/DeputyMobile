import React, {useCallback, useState, useEffect} from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, CalendarDays, Clock, Users, Tag, BookOpenText } from 'lucide-react-native';
import MapView, {Marker, Yamap} from 'react-native-yamap-plus'; // Используем стандартный react-native-maps, так как 'react-native-yamap-plus' может требовать сложной настройки и ключей, а для отображения одной точки достаточно этого. Если Yandex Maps критичны, нужно настроить их отдельно.

import { Event} from '@/models/EventModel';
import { AuthTokenManager } from "@/components/LoginScreen/LoginScreen"; // Путь может отличаться
import { apiUrl } from "@/api/api"; // Путь может отличаться

const EventDetailsScreen: React.FC = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [event, setEvent] = useState<Event | undefined>();

    const fetchEvent = useCallback(async (isRefresh = false) => {
        try {
            const token = AuthTokenManager.getToken();
            if (!isRefresh) setLoading(true);

            const response = await fetch(`${apiUrl}/api/Events/${id}`, {
                headers: { Accept: 'text/plain', Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(`Error fetching event: ${response.status}`);
            }
            const data: Event = await response.json();
            setEvent(data);
        } catch (e) {
            console.error('Ошибка при загрузке событий:', e);
            // Можно добавить отображение ошибки пользователю
        } finally {
            if (isRefresh) setRefreshing(false);
            else setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchEvent(true);
    }, [fetchEvent]);

    if (loading && !event) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#349339" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Событие не найдено или произошла ошибка загрузки.</Text>
                <TouchableOpacity style={styles.backButtonInline} onPress={() => router.back()}>
                    <Text style={styles.backButtonTextInline}>Назад к списку</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const startDate = new Date(event.start_at);
    const endDate = new Date(event.end_at);

    const formatDate = (d: Date) =>
        d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Парсинг местоположения
    const locationParts = event.location.split('|');
    const address = locationParts[0];
    let coords: { latitude: number; longitude: number } | null = null;
    if (locationParts.length > 1) {
        const coordStrings = locationParts[1].split(',');
        if (coordStrings.length === 2) {
            coords = {
                latitude: parseFloat(coordStrings[0]),
                longitude: parseFloat(coordStrings[1]),
            };
        }
    }

    const openInMaps = () => {
        if (coords) {
            const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
            const url = `${scheme}${coords.latitude},${coords.longitude}?q=${encodeURIComponent(address)}`;
            Linking.openURL(url);
        } else {
            // Если координат нет, пробуем искать по адресу
            const url = Platform.OS === 'ios'
                ? `maps:?q=${encodeURIComponent(address)}`
                : `geo:0,0?q=${encodeURIComponent(address)}`;
            Linking.openURL(url);
        }
    };

    const getEventTypeLabel = (type: Event['type']) => {
        switch (type) {
            case 'Event': return 'Событие';
            case 'Meeting': return 'Встреча';
            case 'Commission': return 'Комиссия';
            default: return type;
        }
    };

    return (
        <View style={styles.mainContainer}>
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 15 }]}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle} numberOfLines={2}>{event.title}</Text>
                    <Text style={styles.headerSubtitle}>{getEventTypeLabel(event.type)} • {event.organizer}</Text>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#349339']}
                        tintColor="#349339"
                    />
                }
            >
                {/* Карточка даты и времени */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <CalendarDays size={20} color="#0f6219" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Дата и время</Text>
                    </View>
                    <View style={styles.dateTimeRow}>
                        <View style={styles.dateTimeBlock}>
                            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                            <View style={styles.timeRow}>
                                <Clock size={14} color="#6b7280" style={styles.timeIcon}/>
                                <Text style={styles.timeText}>{formatTime(startDate)}</Text>
                            </View>
                        </View>
                        <Text style={styles.dateTimeSeparator}>—</Text>
                        <View style={styles.dateTimeBlock}>
                            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                            <View style={styles.timeRow}>
                                <Clock size={14} color="#6b7280" style={styles.timeIcon}/>
                                <Text style={styles.timeText}>{formatTime(endDate)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Карточка места проведения */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <MapPin size={20} color="#0f6219" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Место проведения</Text>
                    </View>
                    <Text style={styles.addressText}>{address}</Text>
                    {coords && (
                        <TouchableOpacity style={styles.mapContainer} onPress={openInMaps}>
                            <Yamap
                                style={styles.map}
                                initialRegion={{
                                    lat: coords.latitude,
                                    lon: coords.longitude,
                                    zoom: 8,
                                    azimuth: 0,
                                    tilt: 0
                                }}
                                interactiveDisabled={true} // чтобы карта не реагировала на жесты
                            >
                                <Marker
                                    point={{ lat: coords.latitude, lon: coords.longitude }}
                                />
                            </Yamap>
                            <View style={styles.mapOverlay}>
                                <Text style={styles.mapOverlayText}>Открыть в картах</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Карточка описания */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <BookOpenText size={20} color="#0f6219" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Описание</Text>
                    </View>
                    <Text style={styles.descriptionText}>{event.description}</Text>
                </View>

                {/* Карточка организатора */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <Users size={20} color="#0f6219" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Организатор</Text>
                    </View>
                    <Text style={styles.organizerText}>{event.organizer}</Text>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f9f9f9', // Как в contentSection EventsScreen
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: 'Inter_400Regular',
    },
    backButtonInline: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#0f6219',
        borderRadius: 8,
    },
    backButtonTextInline: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 25,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'PlayfairDisplay_700Bold', // Используем шрифт из оригинала
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
        fontFamily: 'Inter_400Regular',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 8,
    },
    cardIcon: {
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        color: '#0f6219',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateTimeBlock: {
        flex: 1,
        alignItems: 'flex-start',
    },
    dateText: {
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
        color: '#0b2340',
        marginBottom: 2,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeIcon: {
        marginRight: 4,
    },
    timeText: {
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
        color: '#6b7280',
    },
    dateTimeSeparator: {
        fontSize: 18,
        color: '#d1d5db',
        marginHorizontal: 10,
        fontFamily: 'Inter_400Regular',
    },
    addressText: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#0b2340',
        marginBottom: 12,
        lineHeight: 20,
    },
    mapContainer: {
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    map: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: 6,
        alignItems: 'center',
    },
    mapOverlayText: {
        color: '#ffffff',
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
    },
    descriptionText: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#4b5563',
        lineHeight: 22,
    },
    organizerText: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
        color: '#0b2340',
    },
});

export default EventDetailsScreen;
