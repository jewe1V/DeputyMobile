// utils/FileLauncher/FileLauncher.native.ts
import { open } from 'react-native-file-viewer-turbo';

export const openFile = async (path: string) => {
    try {
        await open(path);
    } catch (error) {
        console.error("Native File Viewer Error:", error);
        throw error;
    }
};
