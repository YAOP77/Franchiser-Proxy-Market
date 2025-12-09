@echo off
echo ========================================
echo Configuration Git - Boutique Proxy Market
echo ========================================
echo.

echo [1/6] Initialisation Git...
git init
if %errorlevel% equ 0 (
    echo ✓ Git initialise
) else (
    echo Git deja initialise
)

echo.
echo [2/6] Configuration Git...
git config user.name "YAOP77"
git config user.email "yaop77@users.noreply.github.com"
echo ✓ Configuration definie

echo.
echo [3/6] Ajout des fichiers...
git add .
echo ✓ Fichiers ajoutes

echo.
echo [4/6] Creation du commit...
git commit -m "Initial commit: Boutique Proxy Market Dashboard"
if %errorlevel% equ 0 (
    echo ✓ Commit cree avec succes
) else (
    echo Erreur lors de la creation du commit
    pause
    exit /b 1
)

echo.
echo [5/6] Configuration de la branche main...
git branch -M main
echo ✓ Branche main configuree

echo.
echo [6/6] Configuration du remote GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/YAOP77/Franchiser-Proxy-Market.git
echo ✓ Remote configure

echo.
echo ========================================
echo Push vers GitHub
echo ========================================
echo.
echo Tentative de push vers GitHub...
echo Note: Vous devrez peut-etre vous authentifier avec GitHub
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✓ Push reussi! Le projet est maintenant sur GitHub.
) else (
    echo.
    echo Le push a echoue. Raisons possibles:
    echo   - Authentification GitHub requise
    echo   - Le depot GitHub n'existe pas encore
    echo   - Probleme de connexion reseau
    echo.
    echo Pour resoudre:
    echo   1. Creez le depot sur GitHub: https://github.com/YAOP77/Franchiser-Proxy-Market
    echo   2. Configurez votre authentification GitHub (token ou SSH)
    echo   3. Reessayez: git push -u origin main
)

echo.
pause
