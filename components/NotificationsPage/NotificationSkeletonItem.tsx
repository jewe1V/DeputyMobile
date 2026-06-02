import { View } from "react-native";
import { styles } from "./notifications-page";
import React from "react";
import { SkeletonItem } from "../ui/Shared/SkeletonLoader";
import { useTheme } from "@/context/ThemeContext";

export const NotificationSkeletonItem = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.notificationItem, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
            <View style={styles.row}>

                {/* Иконка */}
                <View style={styles.iconWrapper}>
                    <SkeletonItem
                        width={20}
                        height={20}
                        borderRadius={10}
                        marginBottom={0}
                    />
                </View>

                {/* Контент */}
                <View style={styles.content}>

                    {/* Верхняя строка */}
                    <View style={styles.topRow}>
                        <SkeletonItem
                            width={'70%'}
                            height={16}
                            borderRadius={4}
                            marginBottom={0}
                        />

                        <SkeletonItem
                            width={60}
                            height={12}
                            borderRadius={4}
                            marginBottom={0}
                        />
                    </View>

                    <View style={{marginTop: 6}}>
                    <SkeletonItem
                        width={'90%'}
                        height={14}
                        borderRadius={4}
                        marginBottom={0}
                    />
                    </View>
                </View>

                <SkeletonItem
                    width={18}
                    height={18}
                    borderRadius={9}
                    marginBottom={0}
                />
            </View>
        </View>
    );
};
