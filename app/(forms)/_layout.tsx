import { Stack } from "expo-router"

const StackLayout = () => {
    return (
        <Stack>
            <Stack.Screen
                name="NewTaskScreen"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TaskDetailScreen"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CreateEventScreen"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}

export default StackLayout;
