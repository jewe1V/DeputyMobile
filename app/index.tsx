import { Header } from "@/components/Header";
import { ModalScreen } from "@/components/ModalScreen";
import { EmptyState } from "@/components/NewsScreen/components/EmptyState";
import { ErrorState } from "@/components/NewsScreen/components/ErrorState";
import { LoadingScreen } from "@/components/NewsScreen/components/LoadingScreen";
import { styles } from "@/components/NewsScreen/components/styles";
import { usePosts } from "@/components/NewsScreen/hooks/usePorts";
import { PostCard } from "@/components/PostCard";
import { Post } from "@/models/Event";
import { Inter_400Regular, Inter_600SemiBold, useFonts as useInterFonts } from '@expo-google-fonts/inter';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, useFonts as usePlayfair } from '@expo-google-fonts/playfair-display';
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, RefreshControl, StatusBar, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { NotificationProvider } from "@/components/connection";

export const NewsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { posts, loading, error, refreshing, hasMore, fetchMore, refresh } = usePosts();
    const [modalPost, setModalPost] = useState<Post | null>(null);
    const firstLoad = useRef(true);

    const params = useLocalSearchParams();

    useFocusEffect(
        React.useCallback(() => {
            if (firstLoad.current && !loading && !refreshing) {
                firstLoad.current = false;
                refresh();
            }
        }, [refresh, loading, refreshing])
    );

    useEffect(() => {
        if (params.refresh === "true") {
            refresh();
        }
    }, [params.refresh]);

    const handlePostDelete = (postId: string) => {
        setModalPost(null);
        refresh();
    };

    if (loading && posts.length === 0) return <LoadingScreen />;
    if (error && posts.length === 0) return <ErrorState onRetry={refresh} />;
    if (!loading && posts.length === 0) return <EmptyState onRetry={refresh} />;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#f6f7fb" />
            <Header title="Новости" />

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PostCard post={item} onOpen={setModalPost} />
                )}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
                onEndReached={hasMore ? fetchMore : undefined}
                onEndReachedThreshold={0.4}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor="#0a58ff"
                        colors={["#0a58ff"]}
                    />
                }
                ListFooterComponent={
                    loading && posts.length > 0 ? (
                        <ActivityIndicator style={{ marginVertical: 16 }} color="#0a58ff" />
                    ) : null
                }
            />

            <Modal visible={!!modalPost} animationType="slide" onRequestClose={() => setModalPost(null)}>
                <ModalScreen
                    modalPost={modalPost}
                    onClose={() => setModalPost(null)}
                    onPostDelete={handlePostDelete}
                />
            </Modal>
        </View>
    );
};

const App: React.FC = () => {
    const [playfairLoaded] = usePlayfair({
        PlayfairDisplay_700Bold,
        PlayfairDisplay_600SemiBold,
    });

    const [interLoaded] = useInterFonts({
        Inter_400Regular,
        Inter_600SemiBold,
    });

    const fontsLoaded = playfairLoaded && interLoaded;


    return (
        <NotificationProvider>
                    <SafeAreaProvider>
            <NewsScreen />
        </SafeAreaProvider>
        </NotificationProvider>
    );
};

export default App;
