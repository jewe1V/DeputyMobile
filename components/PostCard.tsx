import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Animated,
    GestureResponderEvent,
    Dimensions,
} from 'react-native';
import { Post } from '../models/Event';

const { width } = Dimensions.get('window');

type Props = {
    post: Post;
    onOpen: (p: Post) => void;
    animateIn?: boolean;
    animRef?: Animated.Value;
};

export const PostCard: React.FC<Props> = ({ post, onOpen, animateIn = true }) => {
    const translateX = useRef(new Animated.Value(60)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animateIn) {
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 420,
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 420,
                    useNativeDriver: true
                }),
            ]).start();
        } else {
            translateX.setValue(0);
            opacity.setValue(1);
        }
    }, [animateIn]);

    // Форматирование даты для отображения
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Получаем дату для отображения (предпочтение отдаем publishedAt, если есть)
    const displayDate = post.publishedAt ? post.publishedAt : post.createdAt;

    return (
        <Animated.View style={[styles.card, { transform: [{ translateX }], opacity }]}>
            <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => onOpen(post)}
            >
                <View style={styles.imageWrap}>
                    {post.thumbnailUrl ? (
                        <Image
                            source={{ uri: post.thumbnailUrl }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.image, styles.placeholderImage]}>
                            <Text style={styles.placeholderText}>Нет изображения</Text>
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    <Text style={styles.date}>{formatDate(displayDate)}</Text>
                    <Text style={styles.title} numberOfLines={2}>
                        {post.title}
                    </Text>
                    <Text style={styles.summary} numberOfLines={3}>
                        {post.summary}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginVertical: 10,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    imageWrap: {
        width: '100%',
        height: 180,
        backgroundColor: '#eef4ff',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        backgroundColor: '#f3f6fb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#8a8a8a',
        fontSize: 14,
    },
    content: {
        padding: 14,
    },
    date: {
        fontSize: 12,
        color: '#28954a',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 6,
    },
    title: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: '#09400f',
        marginBottom: 8,
    },
    summary: {
        fontSize: 14,
        color: '#394b5b',
        fontFamily: 'Inter_400Regular',
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 18,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 18,
    },
    emoji: { fontSize: 18, marginRight: 8, color: '#333' },
    actionText: { fontSize: 13, color: '#4b5563', fontFamily: 'Inter_400Regular' },
    active: { color: '#0f6319' },
});
