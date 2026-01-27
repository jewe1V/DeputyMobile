import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Event } from '@/models/Event';

type EventDetailsRouteProp = RouteProp<{ EventDetails: { event: Event } }, 'EventDetails'>;

const EventDetailsScreen: React.FC = () => {
    const route = useRoute<EventDetailsRouteProp>();
    const { event } = route.params;

    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);

    const formatDate = (d: Date) =>
        `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Дата и время:</Text>
                <Text style={styles.metaValue}>{formatDate(startDate)} — {formatDate(endDate)}</Text>
            </View>

            <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Место проведения:</Text>
                <Text style={styles.metaValue}>{event.location}</Text>
            </View>

            <View style={styles.descriptionBlock}>
                <Text style={styles.sectionTitle}>Описание</Text>
                <Text style={styles.description}>{event.description}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 22,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: '#0b2340',
        marginBottom: 16,
    },
    metaBlock: {
        marginBottom: 12,
    },
    metaLabel: {
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        color: '#0f6219',
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#0b2340',
    },
    descriptionBlock: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'PlayfairDisplay_600SemiBold',
        color: '#0b2340',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#4b5563',
        lineHeight: 20,
    },
});

export default EventDetailsScreen;
