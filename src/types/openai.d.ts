// src/types/openai.d.ts
declare module 'openai' {
    export interface MessageContentText {
        type: 'text';
        text: string;
    }

    export interface MessageContentText {
        type: string;
        text: string;
    }
}
