import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <meta charSet="utf-8"/>
            <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"/>

            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

            <link rel="manifest" href="/pwa/manifest.json"/>

            <ScrollViewStyleReset/>

            <style dangerouslySetInnerHTML={{ __html: `
                html, body {
                    overflow: hidden;
                    height: 100%;
                    width: 100%;
                    position: fixed;
                    -webkit-tap-highlight-color: transparent;
                    background-color: #ffffff;
                    margin: 0;
                    padding: 0;
                }
    
                #root {
                    height: 100%;
                    width: 100%;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }
            `}} />
        </head>
        <body>{children}</body>
        </html>
    );
}
