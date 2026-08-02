@echo off
echo.
echo   ==========================================
echo             READINGHUB  v1.0.0
echo   ==========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Node.js no esta instalado.
    echo   Descargalo en https://nodejs.org
    pause
    exit /b 1
)

if not exist "server\node_modules" (
    echo   Instalando dependencias del servidor...
    npm install --prefix server
)

if not exist "client\dist" (
    if not exist "client\node_modules" (
        echo   Instalando dependencias del cliente ^(primera vez, puede tardar^)...
        npm install --prefix client --legacy-peer-deps
    )
    echo   Compilando el cliente...
    npm run build --prefix client
)

echo   Iniciando ReadingHub...
echo   Abri http://localhost:3001 en tu navegador
echo.

node server\index.js
pause
