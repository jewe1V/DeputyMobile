import Animated, {FadeInRight} from "react-native-reanimated";
import {Text, TouchableOpacity, View} from "react-native";
import {styles} from "@/components/DashboardScreen/style";
import {router} from "expo-router";
import {ChevronRight, Clock} from "lucide-react-native";
import React from "react";
import {Event} from "@/models/EventModel"
import {formatDate} from "@/utils";

export interface EventCardProps {
    event: Event;
    index: number;
    displayTasks: number;
}

export const EventCard = ({event, index, displayTasks}: EventCardProps) => {
    return (
        <Animated.View
            key={event.id || index}
            entering={FadeInRight.delay((displayTasks > 0 ? 1100 : 800) + index * 100).duration(500).springify()}
        >
            <TouchableOpacity style={styles.card} onPress={() => router.push({pathname: '/EventDetailsScreen'})}>
                <View style={styles.cardContent}>
                    <View style={styles.eventDateContainer}>
                        <Text style={styles.eventDay}>
                            {new Date(event.start_at).toLocaleDateString('ru-RU', { day: 'numeric' })}
                        </Text>
                        <Text style={styles.eventMonth}>
                            {new Date(event.start_at).toLocaleDateString('ru-RU', { month: 'short' }).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                            {event.title}
                        </Text>
                        <View style={styles.eventTime}>
                            <Clock size={14} color="#6b7280" />
                            <Text style={styles.eventTimeText}>
                                {formatDate(event.start_at)} · {event.location}
                            </Text>
                        </View>
                        {event.isPublic && (
                            <View style={styles.publicBadge}>
                                <Text style={styles.publicBadgeText}>Публичное мероприятие</Text>
                            </View>
                        )}
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                </View>
            </TouchableOpacity>
        </Animated.View>
    )
};

