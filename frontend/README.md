# Frontend (React + TypeScript)

Фронтенд на React 18 с точечным TypeScript (`.tsx` в UI, `mockData.js` и `helpers.js` остаются на JavaScript).

## Стили

Глобальные стили в корневом `index.html` в теге `<style>`.

## Структура

- `src/components` — переиспользуемые UI-компоненты.
- `src/pages` — разделы сайта.
- `src/data` — mock-данные (JS).
- `src/utils` — вспомогательные функции (JS).

## Сборка

```bash
npm install
npm run build
```

На выходе `bundle.js` в корне репозитория (подключается из `index.html`).
