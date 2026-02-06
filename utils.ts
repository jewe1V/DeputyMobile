import { Post } from "@/models/Event";

export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

export const getDisplayDate = (post: Post) => {
    const dateString = post.publishedAt || post.createdAt;
    return formatDate(dateString);
};

export  const formatDateShort = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };


export const getFileSize = (fileName: string): string => {
    const sizes = ['245 КБ', '1.2 МБ', '524 КБ', '3.5 МБ', '892 КБ'];
    return sizes[Math.floor(Math.random() * sizes.length)];
};