import { Stack } from "expo-router"
import Toast from "react-native-toast-message";
import {toastConfig} from "@/components/Toast/toastConfig";
import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";

const StackLayout = () => {
    return (
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
    );
}

export default StackLayout;
