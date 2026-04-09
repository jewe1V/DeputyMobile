import { Stack } from 'expo-router';

export default function EventsLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="DepartmentDetailsScreen"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
