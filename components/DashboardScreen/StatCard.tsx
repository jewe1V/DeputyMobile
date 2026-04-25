import {styles} from "@/components/DashboardScreen/style";
import Animated, {FadeInDown} from "react-native-reanimated";
import {LinearGradient} from "expo-linear-gradient";
import {Text, View} from "react-native";
import {declOfNum} from "@/utils";
import React from "react";
import * as Icons from "lucide-react-native";

interface StatCardProps {
    iconName: keyof typeof Icons;
    count: number;
    labels: [string, string, string];
    delay: number;
}

export const StatCard = ({iconName, count, labels, delay} : StatCardProps) => {
    const IconComponent = Icons[iconName] as React.ComponentType<{ size: number; color: string }>;
    return(
        <Animated.View style={styles.statCardContainer} entering={FadeInDown.delay(delay).duration(600).springify()}>
            <LinearGradient colors={['#ffffff', '#fffafa']} style={styles.statCard}>
                <View style={styles.statIcon}><IconComponent size={20} color="black" /></View>
                <Text style={styles.statNumber}>{count}</Text>
                <Text style={styles.statLabel}>{declOfNum(count, labels)}</Text>
            </LinearGradient>
        </Animated.View>
    )
};
