@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===================================================
echo   Monitor de Validade - Inicializador Automatico
echo ===================================================
echo.

if not exist "node_modules\" (
    echo [1/2] Pasta node_modules nao encontrada. Instalando dependencias...
    call npm.cmd install
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao instalar as dependencias. Verifique se o Node.js esta instalado.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas com sucesso!
    echo.
) else (
    echo [1/2] Dependencias ja estao instaladas ^(node_modules encontrado^).
    echo.
)

echo [2/2] Iniciando a aplicacao ^(Web + QR Code para Expo Go^)...
echo Dica: O navegador abrira automaticamente, e voce tambem pode ler o QR Code no celular.
echo.
call npx.cmd expo start --web

pause

