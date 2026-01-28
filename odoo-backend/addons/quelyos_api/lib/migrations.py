# -*- coding: utf-8 -*-
"""
Database Migrations pour Quelyos ERP

Gestion des migrations de données:
- Migrations versionnées
- Rollback possible
- Vérification de cohérence
- Logging détaillé
- Support dry-run
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from abc import ABC, abstractmethod
from functools import wraps

_logger = logging.getLogger(__name__)

# Configuration
MIGRATIONS_TABLE = 'quelyos_migrations'
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')


# =============================================================================
# TYPES
# =============================================================================

@dataclass
class MigrationResult:
    """Résultat d'une migration"""
    success: bool
    version: str
    name: str
    duration_ms: int = 0
    error: Optional[str] = None
    rows_affected: int = 0


@dataclass
class MigrationState:
    """État d'une migration"""
    version: str
    name: str
    applied_at: str
    checksum: str
    success: bool


# =============================================================================
# MIGRATION BASE
# =============================================================================

class Migration(ABC):
    """
    Classe de base pour les migrations.

    Usage:
        class Migration_001_AddProductFields(Migration):
            version = '001'
            name = 'add_product_fields'
            description = 'Ajoute les champs personnalisés aux produits'

            def up(self, env, cr):
                cr.execute('''
                    ALTER TABLE product_template
                    ADD COLUMN IF NOT EXISTS custom_field VARCHAR(100)
                ''')

            def down(self, env, cr):
                cr.execute('''
                    ALTER TABLE product_template
                    DROP COLUMN IF EXISTS custom_field
                ''')
    """

    version: str = '000'
    name: str = 'unnamed'
    description: str = ''
    dependencies: List[str] = []

    @abstractmethod
    def up(self, env, cr):
        """Applique la migration"""
        pass

    def down(self, env, cr):
        """Annule la migration (optionnel)"""
        raise NotImplementedError(f"Rollback not implemented for {self.version}")

    def validate(self, env, cr) -> bool:
        """Valide que la migration a été correctement appliquée"""
        return True

    def get_checksum(self) -> str:
        """Génère un checksum de la migration"""
        import hashlib
        import inspect
        source = inspect.getsource(self.__class__)
        return hashlib.md5(source.encode()).hexdigest()[:16]


# =============================================================================
# MIGRATION RUNNER
# =============================================================================

class MigrationRunner:
    """
    Exécuteur de migrations.

    Usage:
        runner = MigrationRunner(env)

        # Enregistrer des migrations
        runner.register(Migration_001_AddProductFields())
        runner.register(Migration_002_UpdatePrices())

        # Appliquer toutes les migrations en attente
        results = runner.migrate()

        # Rollback à une version
        runner.rollback_to('001')

        # Voir l'état
        status = runner.status()
    """

    def __init__(self, env):
        self.env = env
        self.cr = env.cr
        self._migrations: Dict[str, Migration] = {}
        self._ensure_table()

    def _ensure_table(self):
        """Crée la table de migrations si nécessaire"""
        self.cr.execute(f'''
            CREATE TABLE IF NOT EXISTS {MIGRATIONS_TABLE} (
                version VARCHAR(50) PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
                checksum VARCHAR(32),
                success BOOLEAN DEFAULT TRUE,
                rollback_at TIMESTAMP
            )
        ''')
        self.env.cr.commit()

    def register(self, migration: Migration):
        """Enregistre une migration"""
        self._migrations[migration.version] = migration
        _logger.debug(f"Registered migration: {migration.version} - {migration.name}")

    def migrate(self, dry_run: bool = False) -> List[MigrationResult]:
        """
        Applique toutes les migrations en attente.

        Args:
            dry_run: Si True, n'applique pas réellement les migrations

        Returns:
            Liste des résultats
        """
        results = []
        pending = self._get_pending_migrations()

        if not pending:
            _logger.info("No pending migrations")
            return results

        _logger.info(f"Found {len(pending)} pending migrations")

        for migration in pending:
            result = self._apply_migration(migration, dry_run)
            results.append(result)

            if not result.success:
                _logger.error(f"Migration {migration.version} failed, stopping")
                break

        return results

    def migrate_to(self, target_version: str, dry_run: bool = False) -> List[MigrationResult]:
        """Migre jusqu'à une version spécifique"""
        results = []
        pending = self._get_pending_migrations()

        for migration in pending:
            if migration.version > target_version:
                break

            result = self._apply_migration(migration, dry_run)
            results.append(result)

            if not result.success:
                break

        return results

    def rollback(self, dry_run: bool = False) -> Optional[MigrationResult]:
        """Rollback la dernière migration"""
        last = self._get_last_applied()
        if not last:
            _logger.warning("No migration to rollback")
            return None

        migration = self._migrations.get(last.version)
        if not migration:
            raise ValueError(f"Migration {last.version} not registered")

        return self._rollback_migration(migration, dry_run)

    def rollback_to(self, target_version: str, dry_run: bool = False) -> List[MigrationResult]:
        """Rollback jusqu'à une version spécifique"""
        results = []
        applied = list(reversed(self._get_applied_migrations()))

        for state in applied:
            if state.version <= target_version:
                break

            migration = self._migrations.get(state.version)
            if not migration:
                continue

            result = self._rollback_migration(migration, dry_run)
            results.append(result)

            if not result.success:
                break

        return results

    def status(self) -> Dict:
        """Retourne l'état actuel des migrations"""
        applied = self._get_applied_migrations()
        pending = self._get_pending_migrations()

        return {
            'applied': [
                {
                    'version': s.version,
                    'name': s.name,
                    'applied_at': s.applied_at,
                }
                for s in applied
            ],
            'pending': [
                {
                    'version': m.version,
                    'name': m.name,
                    'description': m.description,
                }
                for m in pending
            ],
            'last_version': applied[-1].version if applied else None,
            'total_applied': len(applied),
            'total_pending': len(pending),
        }

    def validate(self) -> Dict[str, bool]:
        """Valide toutes les migrations appliquées"""
        results = {}
        applied = self._get_applied_migrations()

        for state in applied:
            migration = self._migrations.get(state.version)
            if migration:
                try:
                    results[state.version] = migration.validate(self.env, self.cr)
                except Exception as e:
                    _logger.error(f"Validation failed for {state.version}: {e}")
                    results[state.version] = False

        return results

    def _apply_migration(self, migration: Migration, dry_run: bool) -> MigrationResult:
        """Applique une migration"""
        start = datetime.now()
        _logger.info(f"Applying migration: {migration.version} - {migration.name}")

        if dry_run:
            _logger.info(f"[DRY RUN] Would apply: {migration.version}")
            return MigrationResult(
                success=True,
                version=migration.version,
                name=migration.name,
            )

        try:
            # Vérifier les dépendances
            for dep in migration.dependencies:
                if not self._is_applied(dep):
                    raise ValueError(f"Dependency not met: {dep}")

            # Appliquer
            migration.up(self.env, self.cr)
            self.env.cr.commit()

            # Enregistrer
            self._record_applied(migration)

            duration = int((datetime.now() - start).total_seconds() * 1000)
            _logger.info(f"Migration {migration.version} completed in {duration}ms")

            return MigrationResult(
                success=True,
                version=migration.version,
                name=migration.name,
                duration_ms=duration,
            )

        except Exception as e:
            self.env.cr.rollback()
            _logger.error(f"Migration {migration.version} failed: {e}")

            return MigrationResult(
                success=False,
                version=migration.version,
                name=migration.name,
                error=str(e),
            )

    def _rollback_migration(self, migration: Migration, dry_run: bool) -> MigrationResult:
        """Rollback une migration"""
        _logger.info(f"Rolling back: {migration.version} - {migration.name}")

        if dry_run:
            _logger.info(f"[DRY RUN] Would rollback: {migration.version}")
            return MigrationResult(
                success=True,
                version=migration.version,
                name=migration.name,
            )

        try:
            migration.down(self.env, self.cr)
            self.env.cr.commit()

            # Marquer comme rollback
            self.cr.execute(f'''
                UPDATE {MIGRATIONS_TABLE}
                SET rollback_at = NOW(), success = FALSE
                WHERE version = %s
            ''', (migration.version,))
            self.env.cr.commit()

            _logger.info(f"Rollback {migration.version} completed")

            return MigrationResult(
                success=True,
                version=migration.version,
                name=migration.name,
            )

        except Exception as e:
            self.env.cr.rollback()
            _logger.error(f"Rollback {migration.version} failed: {e}")

            return MigrationResult(
                success=False,
                version=migration.version,
                name=migration.name,
                error=str(e),
            )

    def _get_applied_migrations(self) -> List[MigrationState]:
        """Récupère les migrations appliquées"""
        self.cr.execute(f'''
            SELECT version, name, applied_at, checksum, success
            FROM {MIGRATIONS_TABLE}
            WHERE success = TRUE AND rollback_at IS NULL
            ORDER BY version ASC
        ''')

        return [
            MigrationState(
                version=row[0],
                name=row[1],
                applied_at=row[2].isoformat() if row[2] else '',
                checksum=row[3] or '',
                success=row[4],
            )
            for row in self.cr.fetchall()
        ]

    def _get_pending_migrations(self) -> List[Migration]:
        """Récupère les migrations en attente"""
        applied_versions = {s.version for s in self._get_applied_migrations()}

        pending = [
            m for v, m in sorted(self._migrations.items())
            if v not in applied_versions
        ]

        return pending

    def _get_last_applied(self) -> Optional[MigrationState]:
        """Récupère la dernière migration appliquée"""
        applied = self._get_applied_migrations()
        return applied[-1] if applied else None

    def _is_applied(self, version: str) -> bool:
        """Vérifie si une version est appliquée"""
        return version in {s.version for s in self._get_applied_migrations()}

    def _record_applied(self, migration: Migration):
        """Enregistre une migration comme appliquée"""
        self.cr.execute(f'''
            INSERT INTO {MIGRATIONS_TABLE} (version, name, checksum, success)
            VALUES (%s, %s, %s, TRUE)
            ON CONFLICT (version) DO UPDATE SET
                applied_at = NOW(),
                success = TRUE,
                rollback_at = NULL
        ''', (migration.version, migration.name, migration.get_checksum()))


# =============================================================================
# DÉCORATEUR
# =============================================================================

def migration(version: str, name: str, description: str = '', dependencies: List[str] = None):
    """
    Décorateur pour créer une migration.

    Usage:
        @migration('001', 'add_custom_fields', 'Ajoute des champs personnalisés')
        def up(env, cr):
            cr.execute('ALTER TABLE ...')

        @migration('001', 'add_custom_fields').down
        def down(env, cr):
            cr.execute('ALTER TABLE ... DROP ...')
    """
    def decorator(up_func):
        class DecoratedMigration(Migration):
            pass

        DecoratedMigration.version = version
        DecoratedMigration.name = name
        DecoratedMigration.description = description
        DecoratedMigration.dependencies = dependencies or []

        def up(self, env, cr):
            up_func(env, cr)

        DecoratedMigration.up = up

        # Permettre d'ajouter le down
        def add_down(down_func):
            def down(self, env, cr):
                down_func(env, cr)
            DecoratedMigration.down = down
            return DecoratedMigration

        DecoratedMigration.down_decorator = staticmethod(add_down)

        return DecoratedMigration

    return decorator


# =============================================================================
# HELPERS
# =============================================================================

def run_migrations(env, migrations: List[Migration], dry_run: bool = False) -> List[MigrationResult]:
    """Helper pour exécuter des migrations"""
    runner = MigrationRunner(env)
    for m in migrations:
        runner.register(m)
    return runner.migrate(dry_run)


def get_migration_status(env) -> Dict:
    """Helper pour obtenir le statut des migrations"""
    return MigrationRunner(env).status()
