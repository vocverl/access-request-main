# Access Request Portal - Branch Strategie

## Repository Structuur

Deze repository gebruikt een **branch-based branding strategie** om dezelfde codebase te onderhouden voor verschillende klanten.

```
access-request-portal/
├── main       → Shared base code (geen branding)
├── profilus   → Profilus branding (accessrequest.profilus.nl)
└── vitens     → Vitens branding
```

## Branches

### `main` - Shared Base
- **Doel**: Bevat alle gedeelde functionaliteit zonder branding
- **Gebruik**: Basis voor nieuwe features en bugfixes
- **Deploy**: Niet direct deployed

### `profilus` - Profilus Branding
- **Kleuren**: Profilus blauw (#3EA0CF), oranje badges (#D86018)
- **Logo**: Profilus logo (images/profilus-logo-blue.png)
- **Email**: @profilus.nl voorbeelden
- **Domain**: accessrequest.profilus.nl (CNAME)
- **Deploy**: GitHub Pages → accessrequest.profilus.nl

### `vitens` - Vitens Branding
- **Kleuren**: Vitens blauw (#2c3c8a)
- **Logo**: Vitens logo (vitens.nl hosted)
- **Email**: @vitens.nl voorbeelden
- **Domain**: TBD
- **Deploy**: TBD

## Workflow

### 1. Nieuwe Feature Ontwikkelen

```bash
# Start vanaf main branch
git checkout main

# Maak feature branch
git checkout -b feature/autocomplete-fix

# Ontwikkel feature
# ... code wijzigingen ...

# Commit en merge naar main
git add .
git commit -m "Add autocomplete fix"
git checkout main
git merge feature/autocomplete-fix
```

### 2. Feature naar Beide Brandings Uitrollen

```bash
# Merge main naar profilus branch
git checkout profilus
git merge main
# Los eventuele conflicts op (meestal geen bij pure functionaliteit)
git push origin profilus

# Merge main naar vitens branch
git checkout vitens
git merge main
# Los eventuele conflicts op (meestal geen bij pure functionaliteit)
git push origin vitens
```

### 3. Branding-Specifieke Wijziging

```bash
# Alleen voor Profilus
git checkout profilus
# ... wijzig logo of kleuren ...
git add .
git commit -m "Update Profilus logo"
git push origin profilus

# Merge NIET naar main (branding blijft gescheiden)
```

## Branding Verschillen

### Kleuren
| Element | Profilus | Vitens |
|---------|----------|--------|
| Header | #3EA0CF | #2c3c8a |
| Badges | #D86018 | #D86018 |
| Links | #3EA0CF | #2c3c8a |

### Assets
| Asset | Profilus | Vitens |
|-------|----------|--------|
| Logo | `images/profilus-logo-blue.png` | Vitens URL |
| Favicon | profilus | vitens |

### Content
| Content | Profilus | Vitens |
|---------|----------|--------|
| Title | "...Profilus" | "...Vitens" |
| Email | @profilus.nl | @vitens.nl |

## Best Practices

1. **Functionele wijzigingen**: Altijd in `main` branch
2. **Branding wijzigingen**: Direct in klant-specifieke branch
3. **Testen**: Test beide branches na merge van `main`
4. **Commits**: Duidelijke commit messages met scope

## Voordelen van Deze Aanpak

✅ **Eén codebase** - Geen code duplicatie
✅ **Eenvoudig onderhoud** - Bugfixes en features slechts 1x implementeren
✅ **Gescheiden branding** - Elke klant heeft eigen branch
✅ **Flexibel** - Makkelijk nieuwe klanten toevoegen (nieuwe branch)
✅ **Git history** - Alle wijzigingen traceerbaar per klant

## GitHub Pages Setup

### Profilus Branch
1. Repository Settings → Pages
2. Source: Deploy from branch `profilus`
3. Custom domain: `accessrequest.profilus.nl`
4. CNAME file aanwezig in profilus branch

### Vitens Branch
TBD - Deploy via andere methode of GitHub Pages

## Nieuwe Klant Toevoegen

```bash
# Start vanaf main
git checkout main

# Maak nieuwe branch voor klant
git checkout -b klantnaam

# Pas branding aan
# 1. Wijzig kleuren in CSS
# 2. Vervang logo
# 3. Update email voorbeelden
# 4. Voeg CNAME toe indien nodig

git add .
git commit -m "Add [klantnaam] branding"
git push origin klantnaam
```
