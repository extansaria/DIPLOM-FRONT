# GYDEX — frontend

Одностраничное приложение (**React 18**, **TypeScript**): каталог упражнений, главная с анатомической схемой, блог, тренировка, профиль и AI-виджет. Сборка — **esbuild** в `bundle.js`, раздача статики через **nginx** (Docker).

**Публичный сайт:** [https://uneasily-engrossing.cloudpub.ru/](https://uneasily-engrossing.cloudpub.ru/)

**Backend (API и БД):** [extansaria/DIPLOM-BACK](https://github.com/extansaria/DIPLOM-BACK)

## Структура

| Путь | Назначение |
|------|------------|
| `index.html` | Оболочка страницы, глобальные стили, подключение `bundle.js` |
| `frontend/src/` | Компоненты (`components/`), страницы (`pages/`), типы, утилиты |
| `frontend/src/main.tsx` | Точка входа React |
| `privacy.html`, `terms.html` | Юридические страницы |
| `frontend/article-*.html` | Отдельные статьи (статика) |
| `Dockerfile` | Сборка фронта и образ nginx со статикой |

Подробности по каталогу `frontend/` — в [frontend/README.md](frontend/README.md).

## Запросы к API

По умолчанию используется **same-origin**: обращения идут на тот же хост, префикс `/api` проксируется nginx к сервису бэкенда (как в Docker Compose из репозитория [DIPLOM-BACK](https://github.com/extansaria/DIPLOM-BACK)). Базовый URL можно переопределить через `window.__AI_API_URL__` в `index.html` (см. `frontend/src/apiBaseUrl.ts`).

## Сборка локально

```bash
npm install
npm run build
```

В корне появится `bundle.js`, который подключается из `index.html`.

## Docker

Из корня репозитория (нужны `Dockerfile` и конфиг nginx, например `nginx-default.conf`, как в полном стеке):

```bash
docker build -t gydex-front .
docker run -p 8080:80 gydex-front
```

В связке с бэкендом удобнее поднимать **весь** проект из [DIPLOM-BACK](https://github.com/extansaria/DIPLOM-BACK) (`docker compose up`): тогда веб доступен на порту **5180** с прокси `/api`.

## Публикация через Cloud Pub

После запуска контейнера с nginx (или полного `docker compose` из бэкенд-репозитория) можно опубликовать сервис через **Cloud Pub** ([cloudpub.ru](https://cloudpub.ru)): направьте туннель на порт веб-сервиса (в полном стеке — **5180**).

Пример URL: **https://uneasily-engrossing.cloudpub.ru/**

Для входа через Google в консоли Google Cloud укажите этот адрес в **Authorized JavaScript origins** (точное совпадение с `https`, без лишнего слэша).
