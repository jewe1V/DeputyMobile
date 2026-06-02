import {styles} from "@/components/DashboardScreen/style";
import Animated, {FadeInDown} from "react-native-reanimated";
import {LinearGradient} from "expo-linear-gradient";
import {Text, View} from "react-native";
import {declOfNum} from "@/utils";
import React from "react";
import * as Icons from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

interface StatCardProps {
    iconName: keyof typeof Icons;
    count: number;
    labels: [string, string, string];
    delay: number;
}

export const StatCard = ({iconName, count, labels, delay} : StatCardProps) => {
    const { colors, isDark } = useTheme();
    const IconComponent = Icons[iconName] as React.ComponentType<{ size: number; color: string }>;
    return(
        <Animated.View style={styles.statCardContainer} entering={FadeInDown.delay(delay).duration(600).springify()}>
            <LinearGradient
                colors={isDark ? [colors.card, colors.card] : ['#ffffff', '#fffafa']}
                style={[styles.statCard, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.05 }]}
            >
                <View style={[styles.statIcon, { backgroundColor: isDark ? colors.iconBox : '#fff', borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.5)' }]}>
                    <IconComponent size={20} color={colors.text} />
                </View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{count}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>{declOfNum(count, labels)}</Text>
            </LinearGradient>
        </Animated.View>
    )
};
