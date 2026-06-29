import { configureStore, createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
  name: "app",
  initialState: {
    darkMode: true,
    language: "en",
    messages: [],
    mainImage: null,
  },
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },

    toggleLanguage(state) {
      state.language = state.language === "en" ? "fa" : "en";
    },

    addImageMessage(state, action) {
      const newId =
        Date.now() + Math.random().toString(36).substr(2, 9);

      state.mainImage = action.payload;

      state.messages.push({
        id: newId,
        type: "image",
        content: action.payload,
        timestamp: new Date().toISOString(),
      });
    },

    setMainImage(state, action) {
      state.mainImage = action.payload;
    },

    addActionPrompt(state) {
      state.messages.push({
        id: "prompt-" + Date.now(),
        type: "action_prompt",
        timestamp: new Date().toISOString(),
      });
    },

    addServerResponse(state, action) {
      state.messages.push({
        id: "res-" + Date.now(),
        type: "image",
        content: action.payload.content,
        isResponse: true,
        timestamp: new Date().toISOString(),
      });
    },

    clearChat(state) {
      state.messages = [];
      state.mainImage = null;
    },
  },
});

export const {
  toggleDarkMode,
  toggleLanguage,
  addImageMessage,
  setMainImage,
  addActionPrompt,
  addServerResponse,
  clearChat,
} = appSlice.actions;

export const store = configureStore({
  reducer: { app: appSlice.reducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});