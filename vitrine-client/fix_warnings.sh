#!/bin/bash

# Corriger catch (error) non utilisés dans authStore
sed -i '' 's/} catch (error: unknown) {/} catch (_error: unknown) {/g' src/store/authStore.ts

# Corriger apostrophes échappées automatiquement par ESLint --fix
# (déjà fait par --fix normalement)

# Corriger <a> vers <Link> dans pages/[slug]
sed -i '' 's|<a href="/"|<Link href="/"|g' src/app/pages/\[slug\]/page.tsx
sed -i '' 's|</a>|</Link>|g' src/app/pages/\[slug\]/page.tsx

echo "✅ Corrections appliquées"
