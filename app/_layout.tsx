import { Stack } from "expo-router"
import Toast from "react-native-toast-message";
import {toastConfig} from "@/components/Toast/toastConfig";
import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import {SafeAreaProvider} from "react-native-safe-area-context";

const StackLayout = () => {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <Stack>
                    <Stack.Screen
                        name="(screens)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="login"
                        options={{ headerShown: false }}
                    />
                </Stack>
                <Toast config={toastConfig} />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

export default StackLayout;
