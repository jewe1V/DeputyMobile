import React, {useState} from "react";
import {Task, TaskStatus} from "@/data/types";
import {mockTasks} from "@/data/mockData";
import {FlatList, ScrollView, Text, TouchableOpacity, View} from "react-native";
import {styles} from "@/components/TaskBoard/style";
import {StatusColumn, statusConfig} from "@/components/TaskBoard/StatusColumn";
import {TaskCard} from "@/components/TaskBoard/TaskCard";
import {Header} from "@/components/Header";
import {Filter} from "lucide-react-native";
import {router} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export function TaskBoardScreen() {
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const insets = useSafeAreaInsets();

    const handleTaskPress = (taskId: string) => {
        router.push({ pathname: "/(screens)/TaskDetailScreen", params: { taskId } });
    };

    const filteredTasks = selectedStatus === 'all'
        ? mockTasks
        : mockTasks.filter(task => task.status === selectedStatus);

    const tasksByStatus = {
        created: mockTasks.filter(t => t.status === 'created'),
        in_progress: mockTasks.filter(t => t.status === 'in_progress'),
        approval: mockTasks.filter(t => t.status === 'approval'),
        completed: mockTasks.filter(t => t.status === 'completed'),
    };

    const renderListHeader = () => (
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        selectedStatus === 'all' && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedStatus('all')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        selectedStatus === 'all' && styles.filterButtonTextActive
                    ]}>
                        Все ({mockTasks.length})
                    </Text>
                </TouchableOpacity>

                {(Object.keys(statusConfig) as TaskStatus[]).map((status) => {
                    const config = statusConfig[status];
                    const Icon = config.icon;
                    const count = tasksByStatus[status].length;
                    return (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterButton,
                                selectedStatus === status && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedStatus(status)}
                        >
                            <Icon
                                size={12}
                                color={selectedStatus === status ? '#fff' : config.color}
                            />
                            <Text style={[
                                styles.filterButtonText,
                                selectedStatus === status && styles.filterButtonTextActive,
                                { marginLeft: 4 }
                            ]}>
                                {config.label} ({count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderListItem = ({ item }: { item: Task }) => (
        <View style={styles.listItem}>
            <View style={[
                styles.statusBadge,
                { backgroundColor: statusConfig[item.status].bgColor }
            ]}>
                <Text style={[
                    styles.statusText,
                    { color: statusConfig[item.status].color }
                ]}>
                    {statusConfig[item.status].label}
                </Text>
            </View>
            <TaskCard task={item} onPress={handleTaskPress} />
        </View>
    );

    return (
        <View style={[
            styles.container,
            { paddingTop: insets.top }
        ]}>
            <View style={styles.header}>
                <Header title={"Доска задач"} subTitle={"Екатеринбургская городская Дума"} isUserButton={false}/>
            </View>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        viewMode === 'board' && styles.toggleButtonActive
                    ]}
                    onPress={() => setViewMode('board')}
                >
                    <Text style={[
                        styles.toggleText,
                        viewMode === 'board' && styles.toggleTextActive
                    ]}>
                        Доска
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        viewMode === 'list' && styles.toggleButtonActive
                    ]}
                    onPress={() => setViewMode('list')}
                >
                    <Text style={[
                        styles.toggleText,
                        viewMode === 'list' && styles.toggleTextActive
                    ]}>
                        Список
                    </Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'board' ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.boardContainer}
                    contentContainerStyle={styles.boardContent}
                >
                    <StatusColumn
                        status="created"
                        tasks={tasksByStatus.created}
                        onTaskPress={handleTaskPress}
                    />
                    <StatusColumn
                        status="in_progress"
                        tasks={tasksByStatus.in_progress}
                        onTaskPress={handleTaskPress}
                    />
                    <StatusColumn
                        status="approval"
                        tasks={tasksByStatus.approval}
                        onTaskPress={handleTaskPress}
                    />
                    <StatusColumn
                        status="completed"
                        tasks={tasksByStatus.completed}
                        onTaskPress={handleTaskPress}
                    />
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredTasks}
                    renderItem={renderListItem}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={renderListHeader}
                    ListEmptyComponent={
                        <View style={styles.emptyList}>
                            <Filter size={48} color="#d1d5db" />
                            <Text style={styles.emptyListText}>Задачи не найдены</Text>
                        </View>
                    }
                    contentContainerStyle={[
                        styles.listContainer,
                        { paddingBottom: insets.bottom } // Добавляем отступ снизу
                    ]}
                />
            )}
        </View>
    );
}
