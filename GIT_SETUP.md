# Instructions pour mettre le projet sur GitHub

Exécutez ces commandes dans l'ordre dans votre terminal PowerShell ou Git Bash :

## 1. Vérifier que Git est installé
```bash
git --version
```

## 2. Initialiser le dépôt Git (si pas déjà fait)
```bash
cd "c:\work project\Boutique_Proxy_Market"
git init
```

## 3. Configurer Git (remplacez par vos informations)
```bash
git config user.name "YAOP77"
git config user.email "votre-email@example.com"
```

## 4. Ajouter tous les fichiers
```bash
git add .
```

## 5. Vérifier les fichiers ajoutés
```bash
git status
```

## 6. Créer le commit initial
```bash
git commit -m "Initial commit: Boutique Proxy Market Dashboard"
```

## 7. Renommer la branche en main
```bash
git branch -M main
```

## 8. Ajouter le remote GitHub
```bash
git remote add origin https://github.com/YAOP77/Franchiser-Proxy-Market.git
```

## 9. Vérifier le remote
```bash
git remote -v
```

## 10. Pousser vers GitHub
```bash
git push -u origin main
```

### Si le push échoue à cause de l'authentification :

**Option 1 : Utiliser un token d'accès personnel**
1. Allez sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Créez un nouveau token avec les permissions `repo`
3. Utilisez le token comme mot de passe lors du push

**Option 2 : Utiliser GitHub CLI**
```bash
gh auth login
git push -u origin main
```

**Option 3 : Vérifier que le dépôt existe**
Assurez-vous que le dépôt `Franchiser-Proxy-Market` existe sur GitHub :
https://github.com/YAOP77/Franchiser-Proxy-Market

Si le dépôt n'existe pas, créez-le d'abord sur GitHub, puis réessayez le push.
