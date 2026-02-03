#!/bin/bash

# Script pour basculer entre 2 comptes Claude Max Pro
# Usage: ./scripts/switch-claude-account.sh [1|2]

set -eE
trap 'echo "⚠️ Erreur ligne $LINENO"; exit 1' ERR

ACCOUNTS_DIR="$HOME/.claude-accounts"
CLAUDE_CONFIG="$HOME/.claude.json"
CLAUDE_DIR="$HOME/.claude"
KEYCHAIN_SERVICE="claude-code"

# Créer le dossier de sauvegarde s'il n'existe pas
mkdir -p "$ACCOUNTS_DIR"

# Fonction pour sauvegarder le compte actuel
save_current_account() {
    local account_num=$1
    local backup_dir="$ACCOUNTS_DIR/account-$account_num"

    mkdir -p "$backup_dir"

    # Sauvegarder le dossier .claude complet
    if [ -d "$CLAUDE_DIR" ]; then
        cp -r "$CLAUDE_DIR" "$backup_dir/dot-claude"
        echo "✓ Dossier .claude sauvegardé pour le compte $account_num"
    fi

    # Sauvegarder le fichier de config s'il existe
    if [ -f "$CLAUDE_CONFIG" ]; then
        cp "$CLAUDE_CONFIG" "$backup_dir/claude.json"
        echo "✓ Configuration sauvegardée pour le compte $account_num"
    fi

    # Sauvegarder les credentials du keychain (macOS)
    if command -v security &> /dev/null; then
        security find-generic-password -s "$KEYCHAIN_SERVICE" -w > "$backup_dir/keychain.txt" 2>/dev/null || true
        if [ -f "$backup_dir/keychain.txt" ]; then
            echo "✓ Credentials keychain sauvegardées pour le compte $account_num"
        fi
    fi

    echo ""
    echo "✅ Compte $account_num sauvegardé avec succès"
}

# Fonction pour restaurer un compte
restore_account() {
    local account_num=$1
    local backup_dir="$ACCOUNTS_DIR/account-$account_num"

    if [ ! -d "$backup_dir" ]; then
        echo "❌ Aucune sauvegarde trouvée pour le compte $account_num"
        echo ""
        echo "💡 Pour configurer ce compte:"
        echo "  1. Connectez-vous à Claude avec le compte souhaité"
        echo "  2. Lancez: ./scripts/switch-claude-account.sh save $account_num"
        exit 1
    fi

    echo "🔄 Nettoyage des credentials actuelles..."
    # Nettoyer le dossier .claude (force même si fichiers protégés)
    if [ -d "$CLAUDE_DIR" ]; then
        chmod -R u+w "$CLAUDE_DIR" 2>/dev/null || true
        rm -rf "$CLAUDE_DIR" 2>/dev/null || true
        # Si toujours présent, essayer avec sudo-less approach
        if [ -d "$CLAUDE_DIR" ]; then
            find "$CLAUDE_DIR" -type f -exec chmod u+w {} \; 2>/dev/null || true
            find "$CLAUDE_DIR" -type d -exec chmod u+w {} \; 2>/dev/null || true
            rm -rf "$CLAUDE_DIR" 2>/dev/null || true
        fi
    fi
    # Nettoyer le fichier de config
    rm -f "$CLAUDE_CONFIG"
    # Nettoyer le keychain
    if command -v security &> /dev/null; then
        security delete-generic-password -s "$KEYCHAIN_SERVICE" 2>/dev/null || true
    fi

    echo "📦 Restauration du compte $account_num..."

    # Restaurer le dossier .claude
    if [ -d "$backup_dir/dot-claude" ]; then
        cp -r "$backup_dir/dot-claude" "$CLAUDE_DIR"
        echo "✓ Dossier .claude restauré"
    fi

    # Restaurer le fichier de config
    if [ -f "$backup_dir/claude.json" ]; then
        cp "$backup_dir/claude.json" "$CLAUDE_CONFIG"
        echo "✓ Configuration restaurée"
    fi

    # Restaurer les credentials du keychain (macOS)
    if [ -f "$backup_dir/keychain.txt" ] && command -v security &> /dev/null; then
        local password=$(cat "$backup_dir/keychain.txt")
        security add-generic-password -s "$KEYCHAIN_SERVICE" -a "claude-code" -w "$password" 2>/dev/null || true
        echo "✓ Credentials keychain restaurées"
    fi

    echo ""
    echo "✅ Basculement vers le compte $account_num terminé"
    echo ""
    echo "🔄 Forçage de la reconnexion..."

    # Demander confirmation avant de relancer
    read -p "Voulez-vous lancer Claude maintenant ? (O/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Oo]$ ]] || [[ -z $REPLY ]]; then
        echo "Lancement de Claude..."
        exec claude
    else
        echo "Pour vous connecter plus tard, lancez: claude"
    fi
}

# Fonction pour afficher l'état des comptes
show_status() {
    echo "📊 État des comptes Claude Max Pro sauvegardés:"
    echo ""

    for i in 1 2; do
        if [ -d "$ACCOUNTS_DIR/account-$i" ]; then
            echo "✅ Compte $i: Configuré"
            if [ -d "$ACCOUNTS_DIR/account-$i/dot-claude" ]; then
                echo "   • Dossier .claude: ✓"
            fi
            if [ -f "$ACCOUNTS_DIR/account-$i/claude.json" ]; then
                echo "   • Configuration: ✓"
            fi
            if [ -f "$ACCOUNTS_DIR/account-$i/keychain.txt" ]; then
                echo "   • Keychain: ✓"
            fi
        else
            echo "❌ Compte $i: Non configuré"
            echo "   → Lancez: ./scripts/switch-claude-account.sh save $i"
        fi
        echo ""
    done

    echo "Compte actuel actif:"
    if [ -f "$CLAUDE_CONFIG" ] || [ -d "$CLAUDE_DIR" ]; then
        echo "✅ Session Claude active"
    else
        echo "❌ Aucune session active"
    fi
}

# Menu principal
case "${1:-}" in
    1|2)
        echo "🔄 Basculement vers le compte $1..."
        restore_account "$1"
        ;;

    save)
        if [ -z "${2:-}" ] || [[ ! "${2}" =~ ^[1-2]$ ]]; then
            echo "Usage: $0 save [1|2]"
            exit 1
        fi
        echo "💾 Sauvegarde du compte actuel comme compte $2..."
        save_current_account "$2"
        ;;

    status|list)
        show_status
        ;;

    *)
        echo "🔐 Switch Claude Account - Gestion de 2 comptes Claude Max Pro"
        echo ""
        echo "Usage: $0 [COMMANDE]"
        echo ""
        echo "Commandes:"
        echo "  1         - Basculer vers le compte 1"
        echo "  2         - Basculer vers le compte 2"
        echo "  save 1    - Sauvegarder le compte actuel comme compte 1"
        echo "  save 2    - Sauvegarder le compte actuel comme compte 2"
        echo "  status    - Afficher l'état des comptes sauvegardés"
        echo ""
        echo "Exemples:"
        echo "  $0 1              # Basculer vers le compte 1"
        echo "  $0 save 2         # Sauvegarder le compte actuel comme compte 2"
        echo "  $0 status         # Voir les comptes disponibles"
        echo ""
        echo "Configuration initiale:"
        echo "  1. Connectez-vous avec votre 1er compte Claude"
        echo "  2. Lancez: $0 save 1"
        echo "  3. Déconnectez-vous et connectez-vous avec le 2ème compte"
        echo "  4. Lancez: $0 save 2"
        echo "  5. Ensuite, utilisez '$0 1' ou '$0 2' pour switcher"
        exit 1
        ;;
esac
