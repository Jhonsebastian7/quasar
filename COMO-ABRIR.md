# Cómo abrir Quasar en VS Code con Live Server

1. Descomprime este zip. Debe quedarte una carpeta llamada **`quasar/`** con `index.html` directamente adentro (no dentro de otra subcarpeta más).
2. Abre VS Code → `Archivo` → `Abrir carpeta...` → selecciona la carpeta `quasar/` (la carpeta completa, no un archivo suelto).
3. Si no tienes la extensión instalada: ve a la pestaña de Extensiones (`Ctrl+Shift+X`), busca **"Live Server"** (autor: Ritwick Dey) e instálala.
4. En el explorador de archivos de VS Code, clic derecho sobre `index.html` → **"Open with Live Server"**.
5. Se abrirá tu navegador en `http://127.0.0.1:5500/index.html` (ya incluí la configuración en `.vscode/settings.json` para que siempre use el puerto 5500 y arranque en `index.html`).

**Si el clic derecho no muestra la opción "Open with Live Server":** significa que abriste un archivo suelto en vez de la carpeta completa (paso 2). Cierra VS Code, vuelve a abrir con `Abrir carpeta...` apuntando a `quasar/`.

**Si ves un listado de archivos en vez de la página:** entra manualmente a `http://127.0.0.1:5500/index.html`.

## Información de cada juego (fechas y datos)

Al hacer clic en un juego se abre una **ficha** con: valoración, tamaño,
sistema y una fecha de lanzamiento aproximada según la generación de la
consola (PS1 1994-2006, PS2 2000-2013, Xbox 2001-2009, Mega Drive 1988-1997,
etc.). Cada juego tiene siempre la misma fecha aproximada y se marca con "≈".

Si además configuras una API key de **RAWG.io** (API gratuita, ver
https://rawg.io/apidocs y pégala en `config.js`), la fecha aproximada se
reemplaza por el lanzamiento OFICIAL, junto con el rating de RAWG y el
Metacritic.
