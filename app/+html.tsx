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
                html, body {
                    margin: 0;
                    padding: 0;
                    
                    /* Жёстко фиксируем на весь экран, включая safe areas */
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    
                    /* НЕТ height: dvh — position fixed + inset: 0 сам справится */
                    width: 100%;
                    height: 100%;
                    
                    overflow: hidden;
                    overscroll-behavior: none;
                    touch-action: none;
                    
                    /* Цвет фона должен совпадать с цветом низа вашего приложения */
                    background-color: #ffffff;
                    
                    -webkit-tap-highlight-color: transparent;
                }

                #root {
                    display: flex;
                    flex: 1;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    /* НЕТ никаких padding-bottom здесь! */
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