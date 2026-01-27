import React, { useMemo, useState } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {Event} from "@/models/Event";
import { useFonts as useInterFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {useFonts as usePlayfair} from "@expo-google-fonts/playfair-display/useFonts";
import {PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold} from "@expo-google-fonts/playfair-display";
import {useSafeAreaInsets} from "react-native-safe-area-context";
interface CalendarProps {
    selectedDate: string | undefined;
    onSelectDate: (date: string) => void;
    events: Event[];
    onMonthChange?: (year: number, month: number) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate, events, onMonthChange }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [pfLoaded] = usePlayfair({ PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold });
    const [interLoaded] = useInterFonts({ Inter_400Regular, Inter_600SemiBold });
    const fontsLoaded = pfLoaded && interLoaded;
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay();
        // Преобразуем воскресенье (0) в 7 для правильного отступа
        return day === 0 ? 7 : day;
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    const daysArray = useMemo(() => {
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [daysInMonth]);

    // Функция для преобразования даты в формат YYYY-MM-DD
    const formatDate = (dateString: string) => {
        return dateString.split('T')[0];
    };

    const eventsByDate = useMemo(() => {
        const map: Record<string, Event[]> = {};
        events.forEach((event) => {
            const dateKey = formatDate(event.startAt);
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(event);
        });
        return map;
    }, [events]);

    const changeMonth = (newMonth: number, newYear: number) => {
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
        if (onMonthChange) {
            onMonthChange(newYear, newMonth);
        }
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            changeMonth(11, currentYear - 1);
        } else {
            changeMonth(currentMonth - 1, currentYear);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            changeMonth(0, currentYear + 1);
        } else {
            changeMonth(currentMonth + 1, currentYear);
        }
    };

    const LoadingScreen: React.FC<LoadingScreenProps> = () => {
        const insets = useSafeAreaInsets();

        return (
            <View style={[styles.loading, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#0a58ff" />
            </View>
        );
    };

    if (!fontsLoaded) {
        return <LoadingScreen />;
    }

    return (
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={prevMonth}>
                    <Text style={styles.calendarNav}>←</Text>
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>{`${months[currentMonth]} ${currentYear}`}</Text>
                <TouchableOpacity onPress={nextMonth}>
                    <Text style={styles.calendarNav}>→</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                    <Text key={day} style={styles.calendarDay}>
                        {day}
                    </Text>
                ))}
                {Array(firstDay - 1)
                    .fill(null)
                    .map((_, idx) => (
                        <View key={`empty-${idx}`} style={styles.calendarEmpty} />
                    ))}
                {daysArray.map((day) => {
                    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day
                        .toString()
                        .padStart(2, '0')}`;
                    const hasEvents = !!eventsByDate[dateStr];

                    return (
                        <TouchableOpacity
                            key={day}
                            style={[
                                styles.calendarDate,
                                selectedDate === dateStr && styles.calendarDateSelected,
                                hasEvents && styles.calendarDateWithEvents,
                            ]}
                            onPress={() => onSelectDate(dateStr)}
                        >
                            <Text
                                style={[
                                    styles.calendarDateText,
                                    selectedDate === dateStr && styles.calendarDateTextSelected,
                                ]}
                            >
                                {day}
                            </Text>
                            {hasEvents && <View style={styles.eventDot} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    calendarContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        paddingBottom: 0,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        marginTop: 5,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    calendarTitle: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay_600SemiBold',
        color: '#0b2340',
    },
    calendarNav: {
        fontSize: 22,
        color: '#0f6319',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: `${100 / 7}%`,
        textAlign: 'center',
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'Inter_400Regular',
        marginBottom: 8,
    },
    calendarDate: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    calendarDateLastRow: {
        marginBottom: 0, // Убираем отступ снизу для последней строки
    },
    calendarDateSelected: {
        backgroundColor: '#0f6219',
        borderRadius: 8,
    },
    calendarDateWithEvents: {
        borderBottomWidth: 2,
        borderBottomColor: '#0f6319',
    },
    calendarDateText: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#0b2340',
    },
    calendarDateTextSelected: {
        color: '#fff',
        fontFamily: 'Inter_600SemiBold',
    },
    calendarEmpty: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
    },
});
