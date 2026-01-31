# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """
    Migration 19.0.1.44.0 - Q2 2026: Modèles RH → x_ prefix
    
    Modèles migrés:
    - hr.employee (10 champs)
    - hr.attendance (12 champs)
    - hr.leave (3 champs)
    - hr.leave.type (3 champs)
    - hr.leave.allocation (1 champ)
    - hr.department (1 champ)
    - hr.job (1 champ)
    
    Total: 31 champs renommés pour isolation Odoo.
    """
    _logger.info("=== Migration 19.0.1.44.0: Q2 RH → x_ prefix ===")
    
    migrations = {
        'hr_employee': [
            ('employee_number', 'x_employee_number'),
            ('first_name', 'x_first_name'),
            ('last_name', 'x_last_name'),
            ('cnss_number', 'x_cnss_number'),
            ('cin_number', 'x_cin_number'),
            ('employee_state', 'x_employee_state'),
            ('bank_name', 'x_bank_name'),
            ('bank_account_number', 'x_bank_account_number'),
            ('seniority', 'x_seniority'),
            ('hire_date', 'x_hire_date'),
        ],
        'hr_attendance': [
            ('overtime', 'x_overtime'),
            ('check_in_mode', 'x_check_in_mode'),
            ('check_out_mode', 'x_check_out_mode'),
            ('check_in_latitude', 'x_check_in_latitude'),
            ('check_in_longitude', 'x_check_in_longitude'),
            ('check_out_latitude', 'x_check_out_latitude'),
            ('check_out_longitude', 'x_check_out_longitude'),
            ('attendance_state', 'x_attendance_state'),
            ('anomaly_reason', 'x_anomaly_reason'),
            ('validated_by', 'x_validated_by'),
            ('validated_date', 'x_validated_date'),
            ('notes', 'x_notes'),
        ],
        'hr_leave': [
            ('reference', 'x_reference'),
            ('refuse_reason', 'x_refuse_reason'),
            ('refused_date', 'x_refused_date'),
        ],
        'hr_leave_type': [
            ('code', 'x_code'),
            ('max_consecutive_days', 'x_max_consecutive_days'),
            ('min_notice_days', 'x_min_notice_days'),
        ],
        'hr_leave_allocation': [
            ('reference', 'x_reference'),
        ],
        'hr_department': [
            ('code', 'x_code'),
        ],
        'hr_job': [
            ('code', 'x_code'),
        ],
    }
    
    total_migrated = 0
    
    for table, fields in migrations.items():
        model_name = table.replace('_', '.')
        _logger.info(f"\n--- Migration table {table} ({model_name}) ---")
        
        for old_name, new_name in fields:
            cr.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name=%s AND column_name=%s
            """, (table, new_name))
            
            if cr.fetchone():
                _logger.info(f"  {new_name} existe déjà, skip")
                continue
            
            cr.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name=%s AND column_name=%s
            """, (table, old_name))
            
            if not cr.fetchone():
                _logger.warning(f"  {old_name} n'existe pas, skip")
                continue
            
            _logger.info(f"  ✓ Renommage {old_name} → {new_name}")
            cr.execute(f"ALTER TABLE {table} RENAME COLUMN {old_name} TO {new_name}")
            
            cr.execute("""
                UPDATE ir_model_fields 
                SET name=%s 
                WHERE model=%s AND name=%s
            """, (new_name, model_name, old_name))
            
            total_migrated += 1
    
    _logger.info(f"\n=== Migration 19.0.1.44.0 terminée: {total_migrated} champs migrés ===")
