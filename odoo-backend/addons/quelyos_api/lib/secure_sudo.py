"""
Helper pour usage sécurisé de sudo() avec vérification de droits.

Ce module fournit des wrappers sécurisés pour éviter l'abus de sudo()
qui contourne toutes les permissions Odoo.

Usage:
    from ..lib.secure_sudo import secure_browse, secure_search

    # Au lieu de :
    Employee = request.env['hr.employee'].sudo()
    employee = Employee.browse(id)

    # Utiliser :
    employee = secure_browse(request.env, 'hr.employee', id, 'read')
"""

from odoo.exceptions import AccessError


def secure_browse(env, model_name, record_id, operation='read', reason=None):
    """
    Browse un record avec vérification de droits AVANT sudo().

    Args:
        env: Environment Odoo (request.env)
        model_name: Nom du modèle (ex: 'hr.employee')
        record_id: ID du record
        operation: Opération ('read', 'write', 'create', 'unlink')
        reason: Raison technique justifiant sudo() (optionnel, pour logging)

    Returns:
        record: Record browsé avec sudo() si droits OK

    Raises:
        AccessError: Si utilisateur n'a pas les droits pour l'opération
    """
    Model = env[model_name]

    # Étape 1 : Vérifier droits AVANT sudo()
    if not Model.check_access_rights(operation, raise_exception=False):
        raise AccessError(
            f"Droits insuffisants pour {operation} sur {model_name}"
        )

    # Étape 2 : Log raison sudo() si fournie
    if reason:
        import logging
        _logger = logging.getLogger(__name__)
        _logger.info(f"[SECURE_SUDO] {model_name}.browse({record_id}) - Reason: {reason}")

    # Étape 3 : sudo() seulement après vérification
    return Model.sudo().browse(record_id)


def secure_search(env, model_name, domain, operation='read', limit=None, offset=0, order=None, reason=None):
    """
    Search avec vérification de droits AVANT sudo().

    Args:
        env: Environment Odoo
        model_name: Nom du modèle
        domain: Domaine de recherche Odoo
        operation: Opération ('read' généralement)
        limit: Limite de résultats
        offset: Offset pour pagination
        order: Ordre de tri
        reason: Raison technique sudo()

    Returns:
        recordset: Records trouvés avec sudo()

    Raises:
        AccessError: Si droits insuffisants
    """
    Model = env[model_name]

    # Vérifier droits
    if not Model.check_access_rights(operation, raise_exception=False):
        raise AccessError(
            f"Droits insuffisants pour {operation} sur {model_name}"
        )

    # Log si raison fournie
    if reason:
        import logging
        _logger = logging.getLogger(__name__)
        _logger.info(f"[SECURE_SUDO] {model_name}.search({domain}) - Reason: {reason}")

    # sudo() après vérification
    return Model.sudo().search(domain, limit=limit, offset=offset, order=order)


def secure_create(env, model_name, vals, reason=None):
    """
    Create avec vérification de droits AVANT sudo().

    Args:
        env: Environment Odoo
        model_name: Nom du modèle
        vals: Valeurs du record à créer
        reason: Raison technique sudo()

    Returns:
        record: Record créé

    Raises:
        AccessError: Si droits insuffisants
    """
    Model = env[model_name]

    if not Model.check_access_rights('create', raise_exception=False):
        raise AccessError(
            f"Droits insuffisants pour create sur {model_name}"
        )

    if reason:
        import logging
        _logger = logging.getLogger(__name__)
        _logger.info(f"[SECURE_SUDO] {model_name}.create() - Reason: {reason}")

    return Model.sudo().create(vals)


def check_tenant_isolation(record, tenant_id):
    """
    Vérifie qu'un record appartient bien au tenant courant.
    Évite les fuites cross-tenant.

    Args:
        record: Record Odoo
        tenant_id: ID du tenant courant

    Raises:
        AccessError: Si record n'appartient pas au tenant
    """
    # Vérifier si modèle a un champ tenant_id
    if hasattr(record, 'tenant_id'):
        if record.tenant_id and record.tenant_id.id != tenant_id:
            raise AccessError(
                f"Cross-tenant access denied: record belongs to tenant {record.tenant_id.id}, "
                f"current tenant is {tenant_id}"
            )

    # Vérifier company_id comme fallback
    elif hasattr(record, 'company_id'):
        if record.company_id and record.company_id.id != tenant_id:
            raise AccessError(
                f"Cross-company access denied: record belongs to company {record.company_id.id}"
            )


# Exemple d'usage dans un controller
"""
from ..lib.secure_sudo import secure_browse, secure_search, check_tenant_isolation

@http.route('/api/hr/employees/<int:employee_id>', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
def get_employee(self, employee_id, tenant_id=None, **kwargs):
    try:
        # ✅ SÉCURISÉ - Vérification droits + sudo()
        employee = secure_browse(
            request.env,
            'hr.employee',
            employee_id,
            operation='read',
            reason='API endpoint requires sudo to bypass multi-company rules'
        )

        if not employee.exists():
            return {'success': False, 'error': 'Employé introuvable'}

        # ✅ Vérifier isolation tenant
        if tenant_id:
            check_tenant_isolation(employee, tenant_id)

        return {
            'success': True,
            'employee': employee.get_employee_data()
        }

    except AccessError as e:
        return {'success': False, 'error': str(e)}
"""
