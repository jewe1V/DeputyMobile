import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { Ionicons } from '@expo/vector-icons';

// Настройка dayjs на русский
dayjs.locale('ru');

type DateTimePickerModalProps = {
    isVisible: boolean;
    mode: 'date' | 'time' | 'datetime';
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    date?: Date;
};

export default function DateTimePickerModal({
                                                isVisible,
                                                mode,
                                                onConfirm,
                                                onCancel,
                                                date,
                                            }: DateTimePickerModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>(mode === 'time' ? 'time' : 'date');
    const [selectedHours, setSelectedHours] = useState<number>(date ? date.getHours() : new Date().getHours());
    const [selectedMinutes, setSelectedMinutes] = useState<number>(date ? date.getMinutes() : new Date().getMinutes());

    const hoursScrollRef = useRef<ScrollView>(null);
    const minutesScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (isVisible && date) {
            setSelectedDate(date);
            setSelectedHours(date.getHours());
            setSelectedMinutes(date.getMinutes());
        } else if (isVisible && !date) {
            const now = new Date();
            setSelectedDate(now);
            setSelectedHours(now.getHours());
            setSelectedMinutes(now.getMinutes());
        }
        if (isVisible) {
            setPickerMode(mode === 'time' ? 'time' : 'date');
        }
    }, [isVisible, date]);

    // Автопрокрутка к выбранному времени
    useEffect(() => {
        if (pickerMode === 'time' && isVisible) {
            setTimeout(() => {
                hoursScrollRef.current?.scrollTo({
                    y: selectedHours * 44,
                    animated: true
                });
                minutesScrollRef.current?.scrollTo({
                    y: (selectedMinutes / 5) * 44,
                    animated: true
                });
            }, 100);
        }
    }, [pickerMode, isVisible]);

    const handleConfirm = () => {
        const finalDate = new Date(selectedDate);
        finalDate.setHours(selectedHours, selectedMinutes, 0, 0);
        onConfirm(finalDate);
    };

    const handleDateChange = (params: { date: Date | any }) => {
        if (params.date) {
            const newDate = params.date instanceof Date ? params.date : dayjs(params.date).toDate();
            setSelectedDate(newDate);

            if (mode === 'datetime' && pickerMode === 'date') {
                setPickerMode('time');
            }
        }
    };

    const formatTime = (value: number) => String(value).padStart(2, '0');

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    // Кастомные локализованные тексты для календаря
    const calendarLocale = {
        months: [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ],
        monthsShort: [
            'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
            'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
        ],
        weekDays: [
            'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
            'Четверг', 'Пятница', 'Суббота'
        ],
        weekDaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.title}>
                            {pickerMode === 'date' ? 'Выберите дату' : 'Выберите время'}
                        </Text>
                        <View style={styles.headerButton} />
                    </View>

                    {/* Mode Tabs для datetime */}
                    {mode === 'datetime' && (
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, pickerMode === 'date' && styles.tabActive]}
                                onPress={() => setPickerMode('date')}
                            >
                                <Ionicons
                                    name="calendar-outline"
                                    size={18}
                                    color={pickerMode === 'date' ? '#0f6319' : '#999'}
                                />
                                <Text style={[styles.tabText, pickerMode === 'date' && styles.tabTextActive]}>
                                    Дата
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, pickerMode === 'time' && styles.tabActive]}
                                onPress={() => setPickerMode('time')}
                            >
                                <Ionicons
                                    name="time-outline"
                                    size={18}
                                    color={pickerMode === 'time' ? '#0f6319' : '#999'}
                                />
                                <Text style={[styles.tabText, pickerMode === 'time' && styles.tabTextActive]}>
                                    Время
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Content */}
                    <View style={styles.content}>
                        {pickerMode === 'date' ? (
                            <View style={styles.calendarWrapper}>
                                <DateTimePicker
                                    mode="single"
                                    date={selectedDate}
                                    onChange={handleDateChange}
                                    selectedItemColor="#0f6319"
                                    headerTextStyle={styles.calendarHeaderText}
                                    weekDaysTextStyle={styles.weekDayText}
                                    calendarTextStyle={styles.calendarText}
                                    todayContainerStyle={styles.todayContainer}
                                    todayTextStyle={styles.todayText}
                                    buttonPrevIcon={<Ionicons name="chevron-back" size={24} color="#0f6319" />}
                                    buttonNextIcon={<Ionicons name="chevron-forward" size={24} color="#0f6319" />}
                                    locale={calendarLocale}
                                />
                            </View>
                        ) : (
                            <View style={styles.timePickerWrapper}>
                                <View style={styles.timePickerContainer}>
                                    {/* Часы */}
                                    <View style={styles.timeColumn}>
                                        <Text style={styles.timeColumnTitle}>Часы</Text>
                                        <View style={styles.timeScrollContainer}>
                                            <ScrollView
                                                ref={hoursScrollRef}
                                                style={styles.timeScroll}
                                                showsVerticalScrollIndicator={false}
                                                snapToInterval={44}
                                                decelerationRate="fast"
                                            >
                                                {/* Padding top для центрирования */}
                                                <View style={{ height: 80 }} />
                                                {hours.map((hour) => (
                                                    <TouchableOpacity
                                                        key={hour}
                                                        style={[
                                                            styles.timeItem,
                                                            selectedHours === hour && styles.timeItemSelected,
                                                        ]}
                                                        onPress={() => setSelectedHours(hour)}
                                                    >
                                                        <Text style={[
                                                            styles.timeItemText,
                                                            selectedHours === hour && styles.timeItemTextSelected,
                                                        ]}>
                                                            {formatTime(hour)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                                {/* Padding bottom для центрирования */}
                                                <View style={{ height: 80 }} />
                                            </ScrollView>
                                            {/* Градиентные затемнения сверху и снизу */}
                                            <View style={styles.scrollFadeTop} />
                                            <View style={styles.scrollFadeBottom} />
                                        </View>
                                    </View>

                                    <Text style={styles.timeSeparator}>:</Text>

                                    {/* Минуты */}
                                    <View style={styles.timeColumn}>
                                        <Text style={styles.timeColumnTitle}>Минуты</Text>
                                        <View style={styles.timeScrollContainer}>
                                            <ScrollView
                                                ref={minutesScrollRef}
                                                style={styles.timeScroll}
                                                showsVerticalScrollIndicator={false}
                                                snapToInterval={44}
                                                decelerationRate="fast"
                                            >
                                                <View style={{ height: 80 }} />
                                                {minutes.map((minute) => (
                                                    <TouchableOpacity
                                                        key={minute}
                                                        style={[
                                                            styles.timeItem,
                                                            selectedMinutes === minute && styles.timeItemSelected,
                                                        ]}
                                                        onPress={() => setSelectedMinutes(minute)}
                                                    >
                                                        <Text style={[
                                                            styles.timeItemText,
                                                            selectedMinutes === minute && styles.timeItemTextSelected,
                                                        ]}>
                                                            {formatTime(minute)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                                <View style={{ height: 80 }} />
                                            </ScrollView>
                                            <View style={styles.scrollFadeTop} />
                                            <View style={styles.scrollFadeBottom} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Selected Date Display */}
                    {pickerMode === 'time' && (
                        <View style={styles.selectedDateDisplay}>
                            <Ionicons name="calendar-outline" size={16} color="#666" />
                            <Text style={styles.selectedDateText}>
                                {dayjs(selectedDate).locale('ru').format('DD MMMM YYYY')}
                            </Text>
                        </View>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>Отмена</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmButtonText}>Готово</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 5,
        gap: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        gap: 6,
    },
    tabActive: {
        backgroundColor: '#e8f5e9',
    },
    tabText: {
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#0f6319',
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    calendarWrapper: {
        minHeight: 350,
    },
    calendarHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    weekDayText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#999',
    },
    calendarText: {
        fontSize: 15,
        color: '#333',
    },
    todayContainer: {
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
    },
    todayText: {
        color: '#0f6319',
        fontWeight: '600',
    },
    timePickerWrapper: {
        height: 260,
        justifyContent: 'center',
    },
    timePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 220,
        paddingVertical: 10,
    },
    timeColumn: {
        flex: 1,
        alignItems: 'center',
    },
    timeColumnTitle: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timeScrollContainer: {
        height: 180,
        width: '100%',
        position: 'relative',
    },
    timeScroll: {
        flex: 1,
        width: '100%',
    },
    timeItem: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
        marginHorizontal: 10,
        borderRadius: 10,
    },
    timeItemSelected: {
        backgroundColor: '#0f6319',
    },
    timeItemText: {
        fontSize: 20,
        color: '#333',
        fontWeight: '500',
    },
    timeItemTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    timeSeparator: {
        fontSize: 24,
        fontWeight: '300',
        color: '#333',
        marginHorizontal: 10,
        marginBottom: 20,
    },
    scrollFadeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    scrollFadeBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    selectedDateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
        backgroundColor: '#f9f9f9',
        marginHorizontal: 20,
        borderRadius: 8,
    },
    selectedDateText: {
        fontSize: 14,
        color: '#666',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#0f6319',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
