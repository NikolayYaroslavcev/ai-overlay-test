# AI Overlay

**Русский** · [English](README.en.md)

Десктопный чат-оверлей, который всегда лежит поверх остальных окон: небольшое безрамочное окно со стеклянной панелью, в которое по WebSocket приходят потоковые ответы в стиле ИИ. Сделан как тестовое задание. «ИИ» здесь это мок-бэкенд с заготовленными ответами, а не настоящая модель.

Tauri 2 + Vue 3 + TypeScript + Vite + Pinia + SCSS.

## Технологический стек

- **Оболочка**: Tauri 2 (Rust), десктопное окно поверх всех окон, без рамки и прозрачное
- **UI**: Vue 3 (`<script setup>`, Composition API) + TypeScript, без библиотеки компонентов
- **Состояние**: Pinia, единственное хранилище `chat` (статус соединения, сообщения, набор текста, ошибки)
- **Стили**: SCSS с CSS custom properties для тем (тёмная тема подключена, светлая подготовлена)
- **Realtime**: самописный `WebSocketClient` (переподключение с backoff, heartbeat на уровне приложения), работающий с мок-сервером на Node.js/`ws`
- **Инструменты**: Vite, ESLint (flat config, контроль границ слоёв), Prettier, vue-tsc, Knip

## Как запустить

```bash
npm install        # install frontend + mock server dependencies
npm run server      # terminal 1 — mock WebSocket backend on ws://localhost:8080
npm run dev          # terminal 2 — Vite dev server on http://localhost:1420
# or, for the full desktop shell instead of the plain web page:
npm run tauri dev    # terminal 2 — requires the Rust toolchain, see below
```

Фронтенд рассчитывает, что мок-сервер уже слушает порт, поэтому сначала запустите `npm run server`. Если сервер работает по другому адресу, URL сокета можно переопределить через `VITE_WS_URL` (см. `src/shared/config/websocket.config.ts`); по умолчанию используется `ws://localhost:8080`.

## Мок-бэкенд WebSocket (`server/`)

`server/index.js` это небольшой Node-сервер на `ws`, который заменяет настоящий ИИ-бэкенд. Он говорит ровно на том wire-протоколе, который уже ожидает клиент (`src/shared/api/types/websocket.ts`), без ИИ и без внешних API-вызовов.

На каждое полученное `{ type: 'chat', id, content, sentAt }` он:

1. Сразу отправляет `{ type: 'typing', isTyping: true }` (подтверждение).
2. Ждёт случайные 500-1200 мс, чтобы это было похоже на задержку инференса.
3. Выбирает случайный заготовленный ответ и отдаёт его по слову сообщениями `{ type: 'chunk', chunk: { messageId, delta, done } }`.
4. Отправляет `{ type: 'typing', isTyping: false }`, когда уходит последний чанк.

Также он отвечает `{ type: 'pong' }` на heartbeat клиента `{ type: 'ping' }` на уровне приложения, структурно проверяет каждую входящую нагрузку (некорректные сообщения получают типизированный ответ `error`, а процесс не падает) и корректно завершается по `Ctrl+C`/`SIGTERM`: перед выходом закрывает все открытые сокеты, чтобы переподключающиеся клиенты видели чистое закрытие, а не зависание.

## Скрипты

- `npm run dev`: только dev-сервер Vite
- `npm run server`: мок-бэкенд WebSocket (`ws://localhost:8080`)
- `npm run tauri dev`: полное десктопное приложение (нужен Rust toolchain, см. ниже)
- `npm run build`: проверка типов + продакшн-сборка фронтенда
- `npm run tauri build`: продакшн-сборка десктопного приложения
- `npm run typecheck`: проверка проекта через `vue-tsc`, без вывода файлов
- `npm run lint` / `lint:fix`: ESLint
- `npm run format` / `format:check`: Prettier
- `npm run knip`: отчёт о неиспользуемых файлах, экспортах и зависимостях

## Требования для сборки

- **Rust toolchain** (`rustc`/`cargo`) нужен для `tauri dev`/`tauri build`. Устанавливается через https://rustup.rs.
- **Иконки приложения**: перед сборкой сгенерируйте набор иконок в `src-tauri/icons/` командой `npm run tauri icon <path-to-1024x1024-png>`.

## Структура проекта

```
ai-overlay-test/
  server/            mock WebSocket backend (plain Node + ws, not part of the src/ layer system)
  src/                see "Layer conventions" below
  src-tauri/          Rust/Tauri shell (window config, capabilities, entry point)
  public/, index.html  Vite entry
```

## Соглашения по слоям (`src/`)

| Слой           | Назначение                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `app/`         | Начальная загрузка приложения: корневой компонент, регистрация провайдеров (Pinia, router, i18n…)     |
| `shared/`      | Переиспользуемый код **без знаний о предметной области**, разбивка ниже                               |
| `entities/`    | Бизнес- и доменные модели и их собственное состояние, принадлежащие моделируемому домену              |
| `features/`    | Пользовательские сценарии, работающие с сущностями                                                    |
| `widgets/`     | Составные блоки UI, собранные из features/entities (`Overlay`, `Chat`, `Input`, `Status`, `TopBar`)   |
| `services/`    | Интеграции с внешним миром, по одной подпапке на интеграцию                                           |
| `composables/` | Сквозные composition-функции Vue, не привязанные к одной сущности или фиче                            |
| `utils/`       | Чистые вспомогательные функции без состояния, по одной подпапке на вид                                |

Слоя `pages/` нет: это одно окно оверлея поверх всех окон, а не многостраничное приложение с роутингом. Слоя `processes/` нет: в FSD он объявлен устаревшим и при необходимости растворяется в `features/`/`app/`.

### Разбивка `shared/`

| Папка               | Назначение                                                                                                                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/`        | Универсальные примитивы UI. Если используется сторонняя библиотека компонентов, её компоненты оборачиваются и реэкспортируются _только_ здесь. Features и widgets никогда не импортируют библиотеку напрямую, поэтому её замена позже затронет только эту папку.        |
| `shared/lib/`       | Переиспользуемая логика, не являющаяся чистой функцией: обёртки и адаптеры библиотек, нетривиальные реактивные хелперы. Отличается от `utils/`, где допустимы только чистые функции.                                                                                     |
| `shared/config/`    | Статическая конфигурация приложения (разбор env, feature flags, константы, выведенные из `import.meta.env`).                                                                                                                                                            |
| `shared/constants/` | Простые константные значения без логики.                                                                                                                                                                                                                               |
| `shared/api/`       | Низкоуровневые универсальные обёртки клиентов (например, типизированная обёртка над `invoke`, база WS-клиента). `shared/api/types/` содержит DTO и типы wire-формата для них. Оркестрация более высокого уровня поверх них относится к `services/`, а не сюда.          |
| `shared/types/`     | Только универсальные, не зависящие от фреймворка служебные типы (`Nullable<T>`, `Maybe<T>`). Доменные типы лежат в `entities/<entity>/model`, DTO и API-типы в `shared/api/types`. Никогда не смешивайте эти три вида в одном файле.                                       |
| `shared/assets/`    | Статические файлы (изображения, шрифты, иконки).                                                                                                                                                                                                                       |
| `shared/styles/`    | Дизайн-токены, темы, reset, типографика, утилитарные классы, см. ниже.                                                                                                                                                                                                 |

### Разбивка `services/`

Одна подпапка на интеграцию, каждая это изолированный модуль со своим публичным API: `websocket/`, `tauri-commands/`, `tauri-events/`, `window/`, `clipboard/`, `storage/`, `notifications/`. Сервисы могут зависеть от `shared/`, но никогда от `entities/`, `features/`, `widgets/` или внутренностей друг друга (собирайте их вместе через `composables/` или фичу, а не импортируйте один сервис из другого).

### Разбивка `composables/` (плоские файлы)

`useWindow`, `useHotkeys`, `useAutoScroll`, `useConnection`, `useTheme`. Один файл на composable (`useTheme.ts`), а не папка, пока у composable не появятся собственные тесты и типы рядом.

### Разбивка `utils/`

`helpers/` (разные чистые функции), `guards/` (type guards и проверки во время выполнения), `formatters/` (данные → строка для отображения), `validators/` (предикаты над вводом, например валидация форм). Каждая функция должна быть чистой и без состояния.

### `shared/styles/`: токены и темизация

```
shared/styles/
  tokens/
    _palette.scss     raw color primitives — never used outside themes/
    _scale.scss       spacing, typography, radii, motion, z-index (theme-agnostic, compile-time SCSS vars)
  themes/
    _dark.scss        maps palette -> semantic CSS custom properties under :root, [data-theme='dark']
    _light.scss       same mapping under [data-theme='light'] (prepared, not wired to a toggle yet)
  _reset.scss
  _typography.scss    reusable text-* classes
  _utilities.scss     small single-purpose utility classes
  global.scss         entry point, imported once in main.ts
```

Цвета это **CSS custom properties** (`var(--color-text-primary)`), а не переменные SCSS. Переменные SCSS являются константами времени компиляции и не могут реагировать на смену темы во время выполнения. Всё остальное (отступы, радиусы, типографическая шкала, z-index) остаётся переменными SCSS времени компиляции, так как от темы не зависит; они автоматически доступны в каждом `.scss`-файле через `@use` в `additionalData`, подключённый в `vite.config.ts`.

Переключение темы во время выполнения позже сводится к `document.documentElement.dataset.theme
= 'light' | 'dark'` из composable `useTheme`, менять CSS не придётся.

Импортируйте всё через алиас `@` (`@/entities/...`), а не через глубокие относительные пути между слоями. ESLint следит за направлением зависимостей между слоями (нижние слои не могут импортировать из верхних) через переопределения `no-restricted-imports` в `eslint.config.js`. Точные правила смотрите в блоке `layerBoundaries` в конце этого файла.
