# -*- coding: utf-8 -*-
"""
Audit Log pour actions administrateur

Trace toutes les actions sensibles:
- Modifications utilisateurs
- Changements de permissions
- Modifications de données critiques
- Accès aux données sensibles
- Actions de configuration
"""

import logging
import json
from datetime import datetime
from functools import wraps
from typing import Optional, Dict, Any

_logger = logging.getLogger(__name__)


class AuditAction:
    """Types d'actions auditées"""
    # Authentification
    LOGIN_SUCCESS = 'auth.login.success'
    LOGIN_FAILED = 'auth.login.failed'
    LOGOUT = 'auth.logout'
    PASSWORD_CHANGE = 'auth.password.change'
    PASSWORD_RESET = 'auth.password.reset'

    # Utilisateurs
    USER_CREATE = 'user.create'
    USER_UPDATE = 'user.update'
    USER_DELETE = 'user.delete'
    USER_PERMISSION_CHANGE = 'user.permission.change'

    # Données critiques
    PRODUCT_CREATE = 'product.create'
    PRODUCT_UPDATE = 'product.update'
    PRODUCT_DELETE = 'product.delete'
    PRODUCT_PRICE_CHANGE = 'product.price.change'

    ORDER_CREATE = 'order.create'
    ORDER_CANCEL = 'order.cancel'
    ORDER_REFUND = 'order.refund'

    CUSTOMER_CREATE = 'customer.create'
    CUSTOMER_UPDATE = 'customer.update'
    CUSTOMER_DELETE = 'customer.delete'

    # Configuration
    CONFIG_UPDATE = 'config.update'
    SETTING_CHANGE = 'setting.change'

    # Données sensibles
    DATA_EXPORT = 'data.export'
    DATA_IMPORT = 'data.import'
    REPORT_GENERATE = 'report.generate'

    # Stock
    STOCK_ADJUSTMENT = 'stock.adjustment'
    INVENTORY_VALIDATE = 'inventory.validate'

    # Finance
    PAYMENT_CREATE = 'payment.create'
    PAYMENT_REFUND = 'payment.refund'
    INVOICE_CREATE = 'invoice.create'
    INVOICE_CANCEL = 'invoice.cancel'


class AuditLogger:
    """
    Service de logging d'audit.

    Stocke les logs dans:
    1. Base de données Odoo (table audit.log)
    2. Fichier de log sécurisé
    3. Optionnel: Service externe (SIEM)
    """

    def __init__(self):
        self._file_logger = logging.getLogger('quelyos.audit')
        # S'assurer que les logs d'audit vont dans un fichier séparé
        if not self._file_logger.handlers:
            handler = logging.FileHandler('/var/log/odoo/audit.log')
            handler.setFormatter(logging.Formatter(
                '%(asctime)s | %(levelname)s | %(message)s'
            ))
            self._file_logger.addHandler(handler)
            self._file_logger.setLevel(logging.INFO)

    def log(
        self,
        action: str,
        user_id: int,
        user_login: str,
        resource_type: str = None,
        resource_id: int = None,
        details: Dict[str, Any] = None,
        ip_address: str = None,
        success: bool = True,
        request=None
    ):
        """
        Enregistre une action d'audit.

        Args:
            action: Type d'action (utiliser AuditAction.*)
            user_id: ID de l'utilisateur
            user_login: Login de l'utilisateur
            resource_type: Type de ressource affectée (product, order, etc.)
            resource_id: ID de la ressource
            details: Détails additionnels (avant/après, etc.)
            ip_address: Adresse IP de l'utilisateur
            success: L'action a-t-elle réussi?
            request: Objet request Odoo (pour extraire IP si non fournie)
        """
        # Extraire IP depuis request si non fournie
        if ip_address is None and request:
            ip_address = self._get_ip(request)

        # Construire l'entrée de log
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'user_id': user_id,
            'user_login': user_login,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'ip_address': ip_address,
            'success': success,
            'details': details or {},
        }

        # Log en fichier
        log_line = json.dumps(log_entry, ensure_ascii=False)
        if success:
            self._file_logger.info(log_line)
        else:
            self._file_logger.warning(log_line)

        # Log Odoo standard
        _logger.info(
            f"AUDIT | {action} | user={user_login}({user_id}) | "
            f"resource={resource_type}:{resource_id} | success={success}"
        )

        # Stocker en base de données Odoo (si disponible)
        self._store_in_db(log_entry)

        return log_entry

    def _get_ip(self, request) -> str:
        """Extrait l'IP de la requête"""
        if not request or not hasattr(request, 'httprequest'):
            return 'unknown'

        # Vérifier X-Forwarded-For (derrière proxy)
        forwarded = request.httprequest.headers.get('X-Forwarded-For', '')
        if forwarded:
            return forwarded.split(',')[0].strip()

        return request.httprequest.remote_addr or 'unknown'

    def _store_in_db(self, log_entry: Dict):
        """Stocke le log dans la base Odoo via le modèle quelyos.audit.log"""
        try:
            from odoo.http import request

            if not hasattr(request, 'env') or not request.env:
                _logger.debug("No Odoo env available for audit log DB storage")
                return

            # Utiliser le modèle quelyos.audit.log
            AuditLog = request.env['quelyos.audit.log'].sudo()

            # Déterminer le tenant_id depuis l'utilisateur si disponible
            tenant_id = None
            if request.env.user and hasattr(request.env.user, 'tenant_id'):
                tenant_id = request.env.user.tenant_id.id if request.env.user.tenant_id else None

            # Extraire user_agent
            user_agent = None
            if hasattr(request, 'httprequest'):
                user_agent = request.httprequest.headers.get('User-Agent', '')[:500]

            AuditLog.log_action(
                action=log_entry.get('action'),
                user_id=log_entry.get('user_id'),
                user_login=log_entry.get('user_login'),
                resource_type=log_entry.get('resource_type'),
                resource_id=log_entry.get('resource_id'),
                ip_address=log_entry.get('ip_address'),
                user_agent=user_agent,
                tenant_id=tenant_id,
                success=log_entry.get('success', True),
                details=log_entry.get('details'),
            )

        except Exception as e:
            _logger.debug(f"Could not store audit log in DB: {e}")


# Instance singleton
_audit_logger = None


def get_audit_logger() -> AuditLogger:
    """Retourne l'instance singleton du logger d'audit"""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger


def audit_log(
    action: str,
    resource_type: str = None,
    get_resource_id=None,
    get_details=None
):
    """
    Décorateur pour auditer automatiquement les actions.

    Usage:
        @audit_log(AuditAction.PRODUCT_UPDATE, 'product')
        def update_product(self, product_id, **kwargs):
            ...

        @audit_log(
            AuditAction.USER_CREATE,
            'user',
            get_resource_id=lambda result: result.get('id'),
            get_details=lambda kwargs: {'email': kwargs.get('email')}
        )
        def create_user(self, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request

            logger = get_audit_logger()
            user_id = request.env.user.id if request.env.user else 0
            user_login = request.env.user.login if request.env.user else 'anonymous'

            # Extraire resource_id des arguments si fourni
            resource_id = None
            if get_resource_id:
                try:
                    # Appeler après exécution pour les créations
                    pass
                except Exception:
                    pass
            elif args:
                # Premier argument numérique = resource_id
                for arg in args:
                    if isinstance(arg, int):
                        resource_id = arg
                        break

            # Extraire détails
            details = {}
            if get_details:
                try:
                    details = get_details(kwargs)
                except Exception:
                    pass

            success = True
            result = None
            error = None

            try:
                result = func(self, *args, **kwargs)

                # Récupérer resource_id du résultat si callback fourni
                if get_resource_id and result:
                    try:
                        resource_id = get_resource_id(result)
                    except Exception:
                        pass

            except Exception as e:
                success = False
                error = str(e)
                raise
            finally:
                # Ajouter erreur aux détails si échec
                if error:
                    details['error'] = error

                logger.log(
                    action=action,
                    user_id=user_id,
                    user_login=user_login,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details=details,
                    success=success,
                    request=request
                )

            return result
        return wrapper
    return decorator


# =============================================================================
# HELPERS POUR ACTIONS COURANTES
# =============================================================================

def log_login(user_id: int, user_login: str, success: bool, ip: str = None, reason: str = None):
    """Log une tentative de connexion"""
    logger = get_audit_logger()
    action = AuditAction.LOGIN_SUCCESS if success else AuditAction.LOGIN_FAILED
    details = {'reason': reason} if reason else {}

    logger.log(
        action=action,
        user_id=user_id,
        user_login=user_login,
        ip_address=ip,
        success=success,
        details=details
    )


def log_data_export(user_id: int, user_login: str, export_type: str, record_count: int, request=None):
    """Log un export de données"""
    logger = get_audit_logger()
    logger.log(
        action=AuditAction.DATA_EXPORT,
        user_id=user_id,
        user_login=user_login,
        resource_type=export_type,
        details={
            'record_count': record_count,
            'export_type': export_type,
        },
        request=request
    )


def log_config_change(user_id: int, user_login: str, setting: str, old_value: Any, new_value: Any, request=None):
    """Log un changement de configuration"""
    logger = get_audit_logger()
    logger.log(
        action=AuditAction.CONFIG_UPDATE,
        user_id=user_id,
        user_login=user_login,
        resource_type='config',
        details={
            'setting': setting,
            'old_value': str(old_value),
            'new_value': str(new_value),
        },
        request=request
    )
