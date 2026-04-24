// utils/FileLauncher/FileLauncher.web.ts

export const openFile = async (url: string) => {
    try {
        // На вебе "путь" — это обычно URL.
        // Если это локальный путь (blob), он тоже сработает.
        window.open(url, '_blank');
    } catch (error) {
        console.error("Web File Viewer Error:", error);
    }
};
