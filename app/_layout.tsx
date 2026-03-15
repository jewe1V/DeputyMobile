import { Stack } from "expo-router"
import Toast from "react-native-toast-message";
import {toastConfig} from "@/components/Toast/toastConfig";
import React from "react";

const StackLayout = () => {
    return (
        <>
            <Stack>
                <Stack.Screen
                    name="(forms)"
                    options={{ headerShown: false }}
                />
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
        </>
    );
}

export default StackLayout;
