import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <meta charSet="utf-8"/>
            <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
            {/* Важно: viewport-fit=cover уже тут, это хорошо */}
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no"/>

            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

            <link rel="manifest" href="/pwa/manifest.json"/>

            <ScrollViewStyleReset/>

            <style dangerouslySetInnerHTML={{ __html: `
                :root {
                  /* Создаем переменную для высоты, чтобы избежать скачков */
                  --app-height: 100%;
                }

                html, body {
                    /* Заменяем fixed на комбинацию, которая лучше работает в PWA */
                    overflow: hidden;
                    height: 100vh;
                    height: 100dvh; 
                    width: 100vw;
                    margin: 0;
                    padding: 0;
                    background-color: #ffffff;
                    /* Блокируем лишние жесты прокрутки на системном уровне */
                    position: fixed; 
                    left: 0;
                    top: 0;
                }
    
                #root {
                    /* Используем safe-area-inset для компенсации полоски iOS */
                    height: 100%;
                    width: 100%;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    
                    /* Убираем резиновый скролл (bounce) который часто ломает верстку */
                    -webkit-overflow-scrolling: touch;
                    
                    /* Компенсируем нижнюю безопасную зону */
                    padding-bottom: 0;
                    box-sizing: border-box;
                }

                /* Исправление для iOS, чтобы фон не "плавал" при скролле */
                body::after {
                    content: "";
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 100vh;
                    z-index: -1;
                    background: inherit;
                }
            `}} />
        </head>
        <body>{children}</body>
        </html>
    );
}
