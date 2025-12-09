# Configuration des Variables d'Environnement sur Vercel

## Problème : Mixed Content Error

Si vous voyez l'erreur :
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint 'http://...'
```

Cela signifie qu'une variable d'environnement dans Vercel utilise `http://` au lieu de `https://`.

## Solution : Mettre à jour la variable d'environnement dans Vercel

### Étapes :

1. **Allez sur votre dashboard Vercel** : https://vercel.com/dashboard

2. **Sélectionnez votre projet** : `Franchiser-Proxy-Market`

3. **Allez dans "Settings"** → **"Environment Variables"**

4. **Cherchez la variable** `VITE_API_BASE_URL`

5. **Si elle existe et contient `http://`**, modifiez-la pour utiliser `https://` :
   ```
   https://boutique-api.proxymarketapp.com/api
   ```

6. **Si elle n'existe pas**, ajoutez-la avec la valeur :
   ```
   VITE_API_BASE_URL=https://boutique-api.proxymarketapp.com/api
   ```

7. **Important** : Sélectionnez tous les environnements (Production, Preview, Development)

8. **Cliquez sur "Save"**

9. **Redéployez votre application** :
   - Allez dans "Deployments"
   - Cliquez sur les 3 points (⋯) du dernier déploiement
   - Cliquez sur "Redeploy"
   - Ou faites un nouveau commit et push

## Vérification

Après le redéploiement, vérifiez que :
- ✅ L'erreur "Mixed Content" a disparu
- ✅ Les requêtes API utilisent `https://` dans la console du navigateur
- ✅ La connexion fonctionne correctement

## Note

Si votre API backend ne supporte pas encore HTTPS, vous devrez :
1. Configurer un certificat SSL sur votre serveur API
2. Ou utiliser un proxy HTTPS (comme Cloudflare) devant votre API
