import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <meta charSet="utf-8"/>
            <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>

            {/* viewport-fit=cover обязательно для работы с safe areas */}
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, shrink-to-fit=no, viewport-fit=cover"
            />

            <meta name="apple-mobile-web-app-capable" content="yes" />
            {/* black-translucent позволяет приложению растягиваться на весь экран, включая статус-бар */}
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

            <meta name="theme-color" content="#ffffff" />
            <link rel="manifest" href="/pwa/manifest.json"/>

            <ScrollViewStyleReset/>

            <style dangerouslySetInnerHTML={{ __html: `
                :root {
                    /* Создаем переменную для высоты, чтобы избежать проблем с 100vh */
                    --app-height: 100%;
                }

                html {
                    /* Исправляет баг Safari с высотой */
                    height: -webkit-fill-available;
                    -webkit-text-size-adjust: 100%;
                    background-color: #ffffff; /* Укажите здесь цвет фона вашего приложения */
                }

                body {
                    /* Используем min-height вместо фиксированного height, если это возможно, 
                       либо жестко фиксируем через -webkit-fill-available */
                    height: 100vh;
                    height: -webkit-fill-available; 
                    width: 100vw;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    position: fixed;
                    top: 0;
                    left: 0;
                    
                    /* Растягиваем фон на safe areas */
                    padding-bottom: env(safe-area-inset-bottom);
                    background-color: #ffffff; 

                    overscroll-behavior: none;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    touch-action: none;
                }
    
                #root {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    width: 100%;
                    /* Важно: контент должен занимать все пространство, включая область под Home Indicator */
                    padding-bottom: env(safe-area-inset-bottom);
                    box-sizing: border-box;
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