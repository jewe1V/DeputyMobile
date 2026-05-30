export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

export const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
        time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        day: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    };
};

export const formatDateToDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

export const formatDateShort = (dateString: string) => {
    if (!dateString) return 'Время не указано';

    const date = new Date(dateString);

    // Проверка на валидность даты, чтобы не получить "Invalid Date"
    if (isNaN(date.getTime())) {
        return dateString; // возвращаем как есть, если это не дата
    }

    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDateForDisplay = (date: Date) => {
    return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
};
const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};


export const getLocalDateKey = (dateString: string): string => {
    const date = new Date(dateString);
    // Используем локальные методы, а не UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Функция для получения сегодняшней локальной даты
export const getTodayLocalKey = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const declOfNum = (n: number, titles: [string, string, string]): string => {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;

    if (abs > 10 && abs < 20) return titles[2];
    if (last > 1 && last < 5) return titles[1];
    if (last === 1) return titles[0];

    return titles[2];
};
