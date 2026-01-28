# -*- coding: utf-8 -*-
"""
Data Export/Import pour Quelyos ERP

Export et import de données:
- Formats: JSON, CSV, Excel
- Export sélectif de champs
- Import avec mapping
- Validation et transformation
- Support des relations
"""

import os
import io
import csv
import json
import logging
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, date
from enum import Enum
import base64

_logger = logging.getLogger(__name__)


# =============================================================================
# TYPES
# =============================================================================

class ExportFormat(Enum):
    """Formats d'export supportés"""
    JSON = 'json'
    CSV = 'csv'
    XLSX = 'xlsx'


class ImportStatus(Enum):
    """États d'un import"""
    PENDING = 'pending'
    VALIDATING = 'validating'
    IMPORTING = 'importing'
    COMPLETED = 'completed'
    PARTIAL = 'partial'
    FAILED = 'failed'


@dataclass
class FieldMapping:
    """Mapping d'un champ pour l'import"""
    source: str  # Nom dans le fichier source
    target: str  # Nom dans Odoo
    transform: Optional[Callable] = None
    required: bool = False
    default: Any = None


@dataclass
class ExportConfig:
    """Configuration d'export"""
    model: str
    fields: List[str]
    domain: List = field(default_factory=list)
    format: ExportFormat = ExportFormat.JSON
    include_headers: bool = True
    date_format: str = '%Y-%m-%d'
    datetime_format: str = '%Y-%m-%dT%H:%M:%S'


@dataclass
class ImportConfig:
    """Configuration d'import"""
    model: str
    mappings: List[FieldMapping]
    format: ExportFormat = ExportFormat.JSON
    update_existing: bool = False
    key_field: str = None  # Champ pour identifier les existants
    skip_errors: bool = False
    batch_size: int = 100


@dataclass
class ImportResult:
    """Résultat d'un import"""
    status: ImportStatus
    total: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[Dict] = field(default_factory=list)


# =============================================================================
# EXPORTER
# =============================================================================

class DataExporter:
    """
    Exporteur de données.

    Usage:
        exporter = DataExporter(env)

        # Export simple
        data = exporter.export('product.product', ['name', 'default_code', 'list_price'])

        # Export avec config
        config = ExportConfig(
            model='product.product',
            fields=['name', 'default_code', 'list_price', 'categ_id.name'],
            domain=[('active', '=', True)],
            format=ExportFormat.CSV
        )
        data = exporter.export_with_config(config)

        # Télécharger
        file_content, filename = exporter.export_to_file(config)
    """

    def __init__(self, env):
        self.env = env

    def export(
        self,
        model: str,
        fields: List[str],
        domain: List = None,
        format: ExportFormat = ExportFormat.JSON,
        limit: int = None
    ) -> Any:
        """
        Export simple des données.

        Args:
            model: Nom du modèle Odoo
            fields: Liste des champs à exporter
            domain: Domaine de recherche
            format: Format d'export
            limit: Limite d'enregistrements

        Returns:
            Données exportées (dict, str, ou bytes selon format)
        """
        config = ExportConfig(
            model=model,
            fields=fields,
            domain=domain or [],
            format=format,
        )
        return self.export_with_config(config, limit)

    def export_with_config(self, config: ExportConfig, limit: int = None) -> Any:
        """Export avec configuration complète"""
        Model = self.env[config.model].sudo()

        # Rechercher les enregistrements
        records = Model.search(config.domain, limit=limit)

        # Extraire les données
        data = self._extract_data(records, config.fields, config)

        # Formater selon le format demandé
        if config.format == ExportFormat.JSON:
            return self._to_json(data)
        elif config.format == ExportFormat.CSV:
            return self._to_csv(data, config.fields, config.include_headers)
        elif config.format == ExportFormat.XLSX:
            return self._to_xlsx(data, config.fields)

        return data

    def export_to_file(self, config: ExportConfig, limit: int = None) -> tuple:
        """
        Export vers un fichier.

        Returns:
            Tuple (contenu_base64, nom_fichier)
        """
        data = self.export_with_config(config, limit)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_name = config.model.replace('.', '_')

        if config.format == ExportFormat.JSON:
            filename = f"{model_name}_{timestamp}.json"
            content = data.encode('utf-8')
        elif config.format == ExportFormat.CSV:
            filename = f"{model_name}_{timestamp}.csv"
            content = data.encode('utf-8')
        elif config.format == ExportFormat.XLSX:
            filename = f"{model_name}_{timestamp}.xlsx"
            content = data

        return base64.b64encode(content).decode(), filename

    def _extract_data(
        self,
        records,
        fields: List[str],
        config: ExportConfig
    ) -> List[Dict]:
        """Extrait les données des records"""
        data = []

        for record in records:
            row = {}
            for field_path in fields:
                value = self._get_field_value(record, field_path, config)
                row[field_path] = value
            data.append(row)

        return data

    def _get_field_value(self, record, field_path: str, config: ExportConfig) -> Any:
        """Récupère la valeur d'un champ (supporte les chemins)"""
        parts = field_path.split('.')
        value = record

        for part in parts:
            if value is None:
                return None
            value = getattr(value, part, None)

        return self._format_value(value, config)

    def _format_value(self, value, config: ExportConfig) -> Any:
        """Formate une valeur pour l'export"""
        if value is None or value is False:
            return None

        if isinstance(value, datetime):
            return value.strftime(config.datetime_format)

        if isinstance(value, date):
            return value.strftime(config.date_format)

        if hasattr(value, 'ids'):
            # Many2one: retourner l'ID ou le display_name
            if len(value) == 1:
                return value.id
            return value.ids

        return value

    def _to_json(self, data: List[Dict]) -> str:
        """Convertit en JSON"""
        return json.dumps(data, indent=2, ensure_ascii=False, default=str)

    def _to_csv(self, data: List[Dict], fields: List[str], include_headers: bool) -> str:
        """Convertit en CSV"""
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields)

        if include_headers:
            writer.writeheader()

        for row in data:
            writer.writerow(row)

        return output.getvalue()

    def _to_xlsx(self, data: List[Dict], fields: List[str]) -> bytes:
        """Convertit en Excel"""
        try:
            import xlsxwriter

            output = io.BytesIO()
            workbook = xlsxwriter.Workbook(output)
            worksheet = workbook.add_worksheet('Data')

            # En-têtes
            for col, field in enumerate(fields):
                worksheet.write(0, col, field)

            # Données
            for row_num, row in enumerate(data, start=1):
                for col, field in enumerate(fields):
                    value = row.get(field)
                    if value is not None:
                        worksheet.write(row_num, col, str(value))

            workbook.close()
            return output.getvalue()

        except ImportError:
            _logger.warning("xlsxwriter not installed, falling back to CSV")
            return self._to_csv(data, fields, True).encode('utf-8')


# =============================================================================
# IMPORTER
# =============================================================================

class DataImporter:
    """
    Importeur de données.

    Usage:
        importer = DataImporter(env)

        # Import JSON
        result = importer.import_json(
            'product.product',
            json_data,
            mappings=[
                FieldMapping('product_name', 'name', required=True),
                FieldMapping('price', 'list_price', transform=float),
                FieldMapping('sku', 'default_code'),
            ]
        )

        # Import CSV
        result = importer.import_csv(
            'product.product',
            csv_content,
            mappings=[...]
        )
    """

    def __init__(self, env):
        self.env = env

    def import_json(
        self,
        model: str,
        data: str,
        mappings: List[FieldMapping],
        **kwargs
    ) -> ImportResult:
        """Import depuis JSON"""
        items = json.loads(data) if isinstance(data, str) else data
        config = ImportConfig(
            model=model,
            mappings=mappings,
            format=ExportFormat.JSON,
            **kwargs
        )
        return self._import_items(items, config)

    def import_csv(
        self,
        model: str,
        data: str,
        mappings: List[FieldMapping],
        **kwargs
    ) -> ImportResult:
        """Import depuis CSV"""
        reader = csv.DictReader(io.StringIO(data))
        items = list(reader)

        config = ImportConfig(
            model=model,
            mappings=mappings,
            format=ExportFormat.CSV,
            **kwargs
        )
        return self._import_items(items, config)

    def import_with_config(self, config: ImportConfig, data: Any) -> ImportResult:
        """Import avec configuration complète"""
        if config.format == ExportFormat.JSON:
            items = json.loads(data) if isinstance(data, str) else data
        elif config.format == ExportFormat.CSV:
            reader = csv.DictReader(io.StringIO(data))
            items = list(reader)
        else:
            raise ValueError(f"Unsupported format: {config.format}")

        return self._import_items(items, config)

    def _import_items(self, items: List[Dict], config: ImportConfig) -> ImportResult:
        """Importe les items"""
        result = ImportResult(status=ImportStatus.VALIDATING, total=len(items))

        if not items:
            result.status = ImportStatus.COMPLETED
            return result

        Model = self.env[config.model].sudo()

        # Validation
        validated_items = []
        for i, item in enumerate(items):
            try:
                mapped = self._map_item(item, config.mappings)
                validated_items.append((i, mapped))
            except Exception as e:
                result.errors.append({
                    'row': i + 1,
                    'error': str(e),
                    'data': item,
                })
                if not config.skip_errors:
                    result.status = ImportStatus.FAILED
                    return result

        # Import
        result.status = ImportStatus.IMPORTING

        for i, (row_num, mapped_item) in enumerate(validated_items):
            try:
                existing = None

                # Chercher existant si update_existing
                if config.update_existing and config.key_field:
                    key_value = mapped_item.get(config.key_field)
                    if key_value:
                        existing = Model.search([
                            (config.key_field, '=', key_value)
                        ], limit=1)

                if existing:
                    existing.write(mapped_item)
                    result.updated += 1
                else:
                    Model.create(mapped_item)
                    result.created += 1

            except Exception as e:
                _logger.error(f"Import error row {row_num + 1}: {e}")
                result.errors.append({
                    'row': row_num + 1,
                    'error': str(e),
                })
                result.skipped += 1

                if not config.skip_errors:
                    result.status = ImportStatus.FAILED
                    return result

        # Statut final
        if result.errors:
            result.status = ImportStatus.PARTIAL
        else:
            result.status = ImportStatus.COMPLETED

        return result

    def _map_item(self, item: Dict, mappings: List[FieldMapping]) -> Dict:
        """Applique le mapping à un item"""
        result = {}

        for mapping in mappings:
            value = item.get(mapping.source)

            if value is None or value == '':
                if mapping.required:
                    raise ValueError(f"Required field '{mapping.source}' is missing")
                value = mapping.default
            else:
                # Appliquer la transformation
                if mapping.transform:
                    try:
                        value = mapping.transform(value)
                    except Exception as e:
                        raise ValueError(
                            f"Transform error for '{mapping.source}': {e}"
                        )

            if value is not None:
                result[mapping.target] = value

        return result


# =============================================================================
# HELPERS
# =============================================================================

def export_model(
    env,
    model: str,
    fields: List[str],
    format: str = 'json',
    **kwargs
) -> Any:
    """Helper pour export rapide"""
    exporter = DataExporter(env)
    return exporter.export(
        model,
        fields,
        format=ExportFormat(format),
        **kwargs
    )


def import_data(
    env,
    model: str,
    data: Any,
    mappings: List[Dict],
    format: str = 'json',
    **kwargs
) -> ImportResult:
    """Helper pour import rapide"""
    importer = DataImporter(env)

    # Convertir les mappings dict en FieldMapping
    field_mappings = [
        FieldMapping(
            source=m['source'],
            target=m['target'],
            required=m.get('required', False),
            default=m.get('default'),
        )
        for m in mappings
    ]

    if format == 'json':
        return importer.import_json(model, data, field_mappings, **kwargs)
    elif format == 'csv':
        return importer.import_csv(model, data, field_mappings, **kwargs)
    else:
        raise ValueError(f"Unsupported format: {format}")
