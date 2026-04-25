import {Text, View, StyleSheet} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";



interface FiltersProps {
    title1: string;
    title2?: string;
    selectComponent1: React.ReactNode;
    selectComponent2?: React.ReactNode;
}

export const Filters = ({
                            title1,
                            title2,
                            selectComponent1,
                            selectComponent2
                        }: FiltersProps) => {
    return (
        <LinearGradient colors={['#ebfdeb', '#fff']} style={styles.filtersSection}>
            <View style={styles.filtersGrid}>
                <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>{title1}</Text>
                    {selectComponent1}
                </View>
                {title2 && <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>{title2}</Text>
                    {selectComponent2}
                </View> }
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    filtersSection: {
        padding: 12,
        marginTop: -24,
        borderRadius: 20,
        marginHorizontal: 15,
        backgroundColor: "rgb(250,254,250)",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
        overflow: 'visible',
    },
    filtersGrid: {
        flexDirection: 'row',
        gap: 8,
        zIndex: 15,
        overflow: 'visible'
    },
    filterGroup: {
        flex: 1,
        zIndex: 11,
        overflow: 'visible'
    },
    filterLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        marginLeft: 2,
    },
})
