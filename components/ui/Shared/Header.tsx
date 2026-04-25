import {styles} from "@/components/TaskBoard/task-board-style";
import {Text, TouchableOpacity, View} from "react-native";
import {declOfNum} from "@/utils";
import {Plus} from "lucide-react-native";
import {LinearGradient} from "expo-linear-gradient";
import React from "react";

export const Header = () => {
    return(
        <LinearGradient
            colors={['#2A6E3F', '#349339']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 15 }]}
        >
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Задачи</Text>
                <Text style={styles.headerSubtitle}>
                    {loading ? 'Загрузка...' : `${filteredTasks.length} ${declOfNum(filteredTasks.length, ['задача', 'задачи', 'задач'])}`}
                </Text>
            </View>
            <TouchableOpacity style={styles.newTaskButton} onPress={handleNewTask}>
                <View pointerEvents="none">
                    <Plus size={20} color="white" />
                </View>
            </TouchableOpacity>
        </LinearGradient>
    );
}
