import React from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E8E8E8',
        borderRadius: 4,
        overflow: 'hidden',
    },
});

interface SkeletonItemProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    marginBottom?: number;
}

export const SkeletonItem: React.FC<SkeletonItemProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 12,
    marginBottom = 4
}) => {
    const { colors, isDark } = useTheme();
    const shimmerAnimation = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnimation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(shimmerAnimation, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        ).start();
    }, [shimmerAnimation]);

    const opacity = shimmerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: isDark ? [0.1, 0.3] : [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    backgroundColor: isDark ? '#334155' : '#E8E8E8',
                    width: typeof width === 'string' ? width : width,
                    height,
                    borderRadius,
                    marginBottom,
                    opacity,
                } as any,
            ]}
        />
    );
};

interface SkeletonLoaderProps {
    count?: number;
    itemHeight?: number;
    itemMargin?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    count = 5,
    itemHeight = 100,
    itemMargin = 12
}) => {
    const { colors } = useTheme();
    return (
        <View style={{ padding: 16, flex: 1, backgroundColor: colors.background }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonItem
                    key={i}
                    height={itemHeight}
                    marginBottom={itemMargin}
                    width="100%"
                />
            ))}
        </View>
    );
};
