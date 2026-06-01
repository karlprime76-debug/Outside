# Stratégie icônes OUTSIDE

## Principe

| Élément | Comportement | Justification |
|---------|-------------|---------------|
| **Icône PWA installée** | **Stable**, version light flat | L'utilisateur ne doit pas voir son icône d'accueil changer de manière imprévisible. |
| **Favicon web** | **Dynamique** light/dark selon thème navigateur | Le favicon est éphémère (onglet), il peut s'adapter pour rester lisible. |
| **Theme-color** | **Dynamique** light/dark | La barre d'adresse du navigateur suit le thème du site. |
| **Interface app** | **Dynamique** dark/light selon préférence système | L'expérience visuelle s'adapte à l'environnement. |

## Sources officielles

Place ces 2 fichiers dans `public/icons/raw/` :

- `outside-light.png` — fond blanc, pin OUTSIDE flat orange-rose (version officielle claire)
- `outside-dark.png` — fond noir, pin OUTSIDE néon glow orange-rose (version officielle sombre)

## Pipeline

```
public/icons/raw/
  outside-light.png
  outside-dark.png

scripts/generate-icons.js  →  génère toutes les déclinaisons
```

## Fichiers générés

### Navigateur (web)

| Fichier | Source | Usage |
|---------|--------|-------|
| `src/app/favicon.ico` | light, multisize 16/32/48 | Onglet navigateur (tous thèmes, fallback) |
| `public/favicon-16x16.png` | light 16x16 | Onglet navigateur haute densité |
| `public/favicon-32x32.png` | light 32x32 | Onglet navigateur standard |
| `public/favicon-dark.png` | dark 32x32 | Onglet navigateur en mode sombre |
| `src/app/apple-icon.png` | light 180x180 | iOS Home Screen / Safari pinned tab |
| `src/app/icon.png` | light 512x512 | Next.js metadata icon |

### Manifest PWA (icône installée stable)

| Fichier | Source | Usage |
|---------|--------|-------|
| `public/icons/icon-192.png` | light 192x192 | Splash screen, petites tuiles |
| `public/icons/icon-512.png` | light 512x512 | Grande tuile, store listing |
| `public/icons/maskable-192.png` | light + padding 10% | Android adaptive icon (safe area) |
| `public/icons/maskable-512.png` | light + padding 10% | Android adaptive icon grande taille |
| `public/icons/monochrome-192.png` | light niveaux de gris | Android themed icon (Material You) |
| `public/icons/monochrome-512.png` | light niveaux de gris | Android themed icon grande taille |

### Shortcuts PWA

| Fichier | Source | Usage |
|---------|--------|-------|
| `public/icons/shortcut-create.png` | light 96x96 | Raccourci "Créer un plan" |
| `public/icons/shortcut-explore.png` | light 96x96 | Raccourci "Explorer" / "Lieux" |

## Safe area

Les icônes **maskable** ont un padding de ~10% sur tous les bords.
Le symbole principal (pin OUTSIDE) reste dans la zone centrale de 80%.
Les éléments visuels proches des bords (glow néon par exemple) sont donc
conservés hors de la zone de rognage des formes adaptatives Android.

## Comment régénérer

```bash
# Copier les sources
cp outside-light.png public/icons/raw/
cp outside-dark.png public/icons/raw/

# Générer
node scripts/generate-icons.js
```

## Limitations connues

- **Changement d'icône installée** : Impossible de faire varier l'icône d'une PWA
  déjà installée côté système. Le manifest est lu à l'installation seulement.
  C'est pourquoi l'icône PWA reste la version **light stable**.
- **Favicon dynamique** : Le navigateur web peut changer le favicon à la volée
  selon `prefers-color-scheme`. C'est fiable et sans effet de bord.
- **Theme-color dynamique** : Même mécanisme que le favicon, mis à jour en
  temps réel via le composant `ThemeMeta`.
