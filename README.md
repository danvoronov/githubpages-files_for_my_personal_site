# danvoronov.com

Статический сайт Дана Воронова. Eleventy собирает раздел Updates из Markdown, а полная сборка добавляет остальные страницы и архивы.

## Локальная работа

Установите Bun 1.4.4, как в GitHub Actions, и выполните `bun install --frozen-lockfile`.

| Команда | Результат |
| --- | --- |
| `bun run serve` | Локальный просмотр всего сайта |
| `bun run serve:updates` | Локальный просмотр Updates |
| `bun run build:full` | Полная сборка в `_site/` |
| `bun run build` | Сборка Updates в `_site/` |
| `bun run clean` | Удаление сгенерированного `_site/` |

Записи лежат в `updates-md/updates/`, вложения в `updates-md/updates/assets/`. Стили раздела находятся в `eleventy/static/updates.css`. Шаблоны и записи используют одну конфигурацию Markdown. При сборке внешним HTTP(S)-ссылкам добавляется открытие в новой вкладке, если автор ссылки явно не указал другой способ открытия.

## Проверки

```sh
bun run install:chromium
bun run build:full
bun run check
```

Проверки охватывают локальные ссылки и ресурсы в сгенерированном HTML, ссылки на PDF, XML и даты RSS, а также восстановление фильтров Studied в Chromium. В `scripts/known-missing-links.json` перечислены уже известные пары страницы и отсутствующего адреса. Новые пропуски останавливают сборку в CI.

Можно использовать установленный Chromium через переменную `CHROMIUM_EXECUTABLE_PATH`. GitHub Actions проверяет pull request и выполняет публикацию из `master` или `main` после успешных проверок.
