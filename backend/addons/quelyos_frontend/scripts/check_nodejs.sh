#!/bin/bash
# Vérifie que Node.js >= 18 est installé

set -e

if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js version $NODE_VERSION < 18"
    exit 1
fi

echo "Node.js $(node -v) OK"
exit 0
