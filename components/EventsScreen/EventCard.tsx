import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Modal,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Event } from '@/models/Event';

const screenHeight = Dimensions.get('window').height;

interface EventCardProps {
    event: Event;
    index?: number;
}

export const EventCard: React.FC<EventCardProps> = ({ event, index = 0 }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const [modalVisible, setModalVisible] = useState(false);
    const modalSlide = useRef(new Animated.Value(screenHeight)).current;
    const modalOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            delay: index * 80,
            useNativeDriver: true,
        }).start();
        Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 80,
            useNativeDriver: true,
        }).start();
    }, []);

    const startDate = new Date(event.startAt);
    const day = startDate.getDate().toString().padStart(2, '0');
    const month = startDate.toLocaleString('ru-RU', { month: 'short' });

    const openModal = () => {
        setModalVisible(true);
        Animated.parallel([
            Animated.timing(modalOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(modalSlide, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 6,
            }),
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(modalOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(modalSlide, {
                toValue: screenHeight,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => setModalVisible(false));
    };

    return (
        <>
            <Animated.View
                style={[
                    styles.cardContainer,
                    { transform: [{ translateX: slideAnim }], opacity: opacityAnim },
                ]}
            >
                <TouchableOpacity activeOpacity={0.8} onPress={openModal} style={styles.cardInner}>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateDay}>{day}</Text>
                        <Text style={styles.dateMonth}>{month}</Text>
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.title} numberOfLines={2}>
                            {event.title}
                        </Text>
                        <Text style={styles.description} numberOfLines={2}>
                            {event.description}
                        </Text>
                        <Text style={styles.location}>{event.location}</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {modalVisible && (
                <Modal visible transparent animationType="none" onRequestClose={closeModal}>
                    <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
                        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={closeModal} />
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.modalSheet,
                            {
                                transform: [{ translateY: modalSlide }],
                            },
                        ]}
                    >
                        <View style={styles.dragIndicator} />

                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <Text style={styles.modalTitle}>{event.title}</Text>

                            <View style={styles.section}>
                                <Text style={styles.metaLabel}>Дата и время</Text>
                                <Text style={styles.metaValue}>
                                    {new Date(event.startAt).toLocaleString('ru-RU', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}{' '}
                                    —{' '}
                                    {new Date(event.endAt).toLocaleString('ru-RU', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.metaLabel}>Место проведения</Text>
                                <Text style={styles.metaValue}>{event.location}</Text>

                                {/* Заглушка для карты */}
                                <View style={styles.mapPlaceholder}>
                                    <Text style={styles.mapText}>🗺 Здесь будет карта</Text>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.metaLabel}>Описание</Text>
                                <Text style={styles.descriptionText}>{event.description}</Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                            <Text style={styles.closeBtnText}>Закрыть</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Modal>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 12,
    },
    cardInner: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    dateBadge: {
        width: 56,
        height: 56,
        backgroundColor: '#0f6319',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    dateDay: {
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
        color: '#fff',
    },
    dateMonth: {
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
        color: '#e0e7ff',
        textTransform: 'uppercase',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
        color: '#0b2340',
        marginBottom: 2,
    },
    description: {
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
        color: '#4b5563',
        marginBottom: 4,
    },
    location: {
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        color: '#0f6219',
    },

    // MODAL
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    overlayTouchable: {
        flex: 1,
    },
    modalSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
        overflow: 'hidden',
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginVertical: 8,
    },
    modalContent: {
        padding: 16,
        paddingBottom: 80,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: '#0b2340',
        marginBottom: 12,
    },
    section: {
        marginBottom: 20,
    },
    metaLabel: {
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        color: '#0f6319',
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#0b2340',
    },
    descriptionText: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#4b5563',
        lineHeight: 20,
    },
    mapPlaceholder: {
        height: 180,
        backgroundColor: '#e6ecff',
        borderRadius: 12,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapText: {
        color: '#0f6119',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    closeBtn: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#0f6219',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
