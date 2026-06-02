import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <meta charSet="utf-8"/>
            <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, shrink-to-fit=no, viewport-fit=cover"
            />

            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

            <meta name="theme-color" content="#ffffff" />

            <link rel="manifest" href="/pwa/manifest.json"/>

            <ScrollViewStyleReset/>

            <style dangerouslySetInnerHTML={{ __html: `
                /* 3. Отключаем "резиновый" скролл и фиксируем body */
                html, body {
                    overflow: hidden;
                    /* Используем dvh, если поддерживается, иначе фоллбэк на % */
                    height: 100%;
                    height: 100dvh; 
                    width: 100%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    -webkit-tap-highlight-color: transparent;
                    background-color: #ffffff;
                    margin: 0;
                    padding: 0;
                    
                    /* Главное оружие против отскока в iOS */
                    overscroll-behavior: none; 
                    touch-action: none; /* Запрет свайпов для навигации браузера */
                }
    
                /* 4. Root должен просто занимать весь экран, а скроллить будут RN компоненты */
                #root {
                    display: flex;
                    flex: 1;
                    height: 100%;
                    height: 100dvh;
                    width: 100%;
                    overflow: hidden; /* Убрали overflow-y: auto */
                }
                input, textarea, select {
                    font-size: 16px !important;
                }
            `}} />
        </head>
        <body>{children}</body>
        </html>
    );
}