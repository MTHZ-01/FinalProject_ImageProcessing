import { configureStore, createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
    name: "app",
    initialState: {
        darkMode: true,
        language: "en",
        messages: [], 
        mainImage: null, // Tracks the last uploaded raw Base64 image string
    },
    reducers: {
        toggleDarkMode(state) {
            state.darkMode = !state.darkMode;
        },
        toggleLanguage(state) {
            state.language = state.language === "en" ? "fa" : "en";
        },
        addImageMessage(state, action) {
            const newId = Date.now() + Math.random().toString(36).substr(2, 9);
            // 1. Save this as the active main target image
            state.mainImage = action.payload; 

            // 2. Append standard image log to chat
            state.messages.push({
                id: newId,
                type: "image",
                content: action.payload,
                timestamp: new Date().toISOString()
            });
        },
        // Injects an interactive control card payload into the feed stream
        addActionPrompt(state) {
            state.messages.push({
                id: "prompt-" + Date.now(),
                type: "action_prompt",
                timestamp: new Date().toISOString()
            });
        },
        // Appends the server response image back to the feed layout
        addServerResponse(state, action) {
            state.messages.push({
                id: "res-" + Date.now(),
                type: "image",
                content: action.payload, // Returned filtered image string
                isResponse: true,
                timestamp: new Date().toISOString()
            });
        },
        clearChat(state) {
            state.messages = [];
            state.mainImage = null;
        }
    },
});

export const {
    toggleDarkMode,
    toggleLanguage,
    addImageMessage,
    addActionPrompt,
    addServerResponse,
    clearChat
} = appSlice.actions;

export const store = configureStore({
    reducer: { app: appSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});