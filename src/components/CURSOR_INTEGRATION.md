# Интеграция курсора и скроллбара

1. В `src/index.tsx` (или `App.tsx`) добавить: `import "./components/scrollbar.css";`
2. Там же: `import CustomCursor from "./components/CustomCursor";` и смонтировать `<CustomCursor />` один раз на верхнем уровне (рядом с роутером; свой CSS он импортирует сам).
3. Опционально: на интерактивные элементы можно вешать `data-cursor` (реакция курсора) и `data-cursor-text="1"` (надстрочная подпись-сноска).
