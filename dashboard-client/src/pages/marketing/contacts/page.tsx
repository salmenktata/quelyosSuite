import { useReducer, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton, ConfirmModal, Modal } from '@/components/common';
import {
  useContactLists,
  useCreateContactList,
  useDeleteContactList,
  usePreviewCSV,
  useImportCSV,
} from '@/hooks/useContactLists';
import { useToast } from '@/contexts/ToastContext';
import { contactsReducer, initialContactsState } from './contactsReducer';
import {
  Plus,
  Users,
  Filter,
  Trash2,
  Search,
  Zap,
  Clock,
  Star,
  UserPlus,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Eye,
} from 'lucide-react';

// Segments prédéfinis
const PREDEFINED_SEGMENTS = [
  {
    id: 'active',
    name: 'Clients actifs',
    description: 'Commande dans les 90 derniers jours',
    icon: Zap,
    color: 'emerald',
    filter_domain: "[('sale_order_ids.date_order', '>=', (datetime.datetime.now() - datetime.timedelta(days=90)).strftime('%Y-%m-%d'))]",
  },
  {
    id: 'inactive',
    name: 'Inactifs 30j',
    description: 'Aucune commande depuis 30 jours',
    icon: Clock,
    color: 'orange',
    filter_domain: "[('sale_order_ids.date_order', '<', (datetime.datetime.now() - datetime.timedelta(days=30)).strftime('%Y-%m-%d'))]",
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Clients avec programme fidélité',
    icon: Star,
    color: 'amber',
    filter_domain: "[('category_id.name', 'ilike', 'vip')]",
  },
  {
    id: 'new',
    name: 'Nouveaux',
    description: 'Inscrits dans les 30 derniers jours',
    icon: UserPlus,
    color: 'blue',
    filter_domain: "[('create_date', '>=', (datetime.datetime.now() - datetime.timedelta(days=30)).strftime('%Y-%m-%d'))]",
  },
];

export default function ContactListsPage() {
  const toast = useToast();
  const { data, isLoading } = useContactLists();
  const createMutation = useCreateContactList();
  const deleteMutation = useDeleteContactList();

  // ✨ REFACTORING: 16 useState → 1 useReducer pour meilleure gestion état
  const [state, dispatch] = useReducer(contactsReducer, initialContactsState);

  // Ref pour file input CSV
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = usePreviewCSV();
  const importMutation = useImportCSV();

  const lists = data?.lists || [];
  const filteredLists = lists.filter((l) =>
    l.name.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!state.newListName.trim()) {
      toast.error('Nom requis');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: state.newListName,
        description: state.newListDescription,
        list_type: state.newListType,
      });
      toast.success('Liste créée avec succès');
      dispatch({ type: 'CLOSE_CREATE_MODAL' });
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDelete = async () => {
    if (!state.deleteId) return;
    try {
      await deleteMutation.mutateAsync(state.deleteId);
      toast.success('Liste supprimée');
      dispatch({ type: 'SET_DELETE_ID', payload: null });
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateSegment = async (segment: typeof PREDEFINED_SEGMENTS[0]) => {
    // Vérifie si segment existe déjà
    const exists = lists.some((l) => l.name === segment.name);
    if (exists) {
      toast.info(`Le segment "${segment.name}" existe déjà`);
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: segment.name,
        description: segment.description,
        list_type: 'dynamic',
        filter_domain: segment.filter_domain,
      });
      toast.success(`Segment "${segment.name}" créé`);
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Import CSV handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = btoa(event.target?.result as string);
      dispatch({ type: "SET_CSV_DATA", payload: { data: base64, fileName: file.name } });

      try {
        const preview = await previewMutation.mutateAsync(base64);
        dispatch({ type: "SET_CSV_PREVIEW", payload: preview });
        dispatch({ type: "SET_COLUMN_MAPPING", payload: preview.column_mapping });
        dispatch({ type: "SET_IMPORT_STEP", payload: 'preview' });
      } catch (err) {
        toast.error('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!state.csvData) return;

    if (!state.importListName && !state.importListId) {
      toast.error('Veuillez entrer un nom de liste');
      return;
    }

    try {
      const result = await importMutation.mutateAsync({
        csv_data: state.csvData,
        list_id: state.importListId || undefined,
        list_name: state.importListName || undefined,
        column_mapping: state.columnMapping,
      });

      dispatch({ type: "SET_IMPORT_RESULT", payload: {
        created: result.created,
        updated: result.updated,
        errors: result.errors,
      } });
      dispatch({ type: "SET_IMPORT_STEP", payload: 'result' });
      toast.success(`${result.total} contacts importés`);
    } catch (err) {
      toast.error('Erreur lors de l\'import');
    }
  };

  const resetImportModal = () => {
    dispatch({ type: "CLOSE_IMPORT_MODAL" });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Listes de contacts' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              Listes de contacts
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos audiences et segments
            </p>
          </div>
          <div className="flex gap-3">
            <button
              data-testid="btn-import-csv"
              onClick={() => dispatch({ type: "OPEN_IMPORT_MODAL" })}
              className="inline-flex items-center gap-2 px-4 py-2 border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Importer CSV
            </button>
            <button
              data-testid="btn-create-list"
              onClick={() => dispatch({ type: "OPEN_CREATE_MODAL" })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvelle liste
            </button>
          </div>
        </div>

        {/* Segments rapides */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-3">
            Segments rapides
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PREDEFINED_SEGMENTS.map((segment) => {
              const Icon = segment.icon;
              const colorClasses: Record<string, string> = {
                emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
                orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50',
                amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50',
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50',
              };
              const exists = lists.some((l) => l.name === segment.name);
              return (
                <button
                  key={segment.id}
                  onClick={() => handleCreateSegment(segment)}
                  disabled={exists || createMutation.isPending}
                  className={`flex items-center gap-2 p-3 rounded-lg transition text-left ${
                    exists
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : colorClasses[segment.color]
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{segment.name}</div>
                    <div className="text-xs opacity-70 truncate">{exists ? 'Déjà créé' : segment.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            data-testid="search-input"
            type="text"
            placeholder="Rechercher une liste..."
            value={state.searchTerm}
            onChange={(e) => dispatch({ type: "SET_SEARCH_TERM", payload: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <Skeleton height={100} />
              </div>
            ))}
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {state.searchTerm ? 'Aucune liste trouvée' : 'Aucune liste de contacts'}
            </p>
            {!state.searchTerm && (
              <button
                onClick={() => dispatch({ type: "OPEN_CREATE_MODAL" })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Créer une liste
              </button>
            )}
          </div>
        ) : (
          <div data-testid="contact-lists" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLists.map((list) => (
              <div
                key={list.id}
                data-testid={`list-card-${list.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-violet-300 dark:hover:border-violet-600 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      {list.list_type === 'dynamic' ? (
                        <Filter className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{list.name}</h3>
                      <Badge variant={list.list_type === 'dynamic' ? 'info' : 'neutral'} size="sm">
                        {list.list_type === 'dynamic' ? 'Dynamique' : 'Statique'}
                      </Badge>
                    </div>
                  </div>
                  <button
                    data-testid={`btn-delete-${list.id}`}
                    onClick={() => dispatch({ type: "SET_DELETE_ID", payload: list.id })}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {list.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {list.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {list.contact_count}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400"> contacts</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(list.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal création */}
        {state.showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Nouvelle liste de contacts
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Nom *
                  </label>
                  <input
                    data-testid="input-list-name"
                    type="text"
                    value={state.newListName}
                    onChange={(e) => dispatch({ type: "SET_NEW_LIST_NAME", payload: e.target.value })}
                    placeholder="Ex: Clients VIP"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={state.newListDescription}
                    onChange={(e) => dispatch({ type: "SET_NEW_LIST_DESCRIPTION", payload: e.target.value })}
                    placeholder="Description de la liste..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => dispatch({ type: "SET_NEW_LIST_TYPE", payload: 'static' })}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        state.newListType === 'static'
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Users className={`w-5 h-5 mb-1 ${state.newListType === 'static' ? 'text-violet-600' : 'text-gray-400'}`} />
                      <div className="font-medium text-gray-900 dark:text-white text-sm">Statique</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Contacts fixes</div>
                    </button>
                    <button
                      onClick={() => dispatch({ type: "SET_NEW_LIST_TYPE", payload: 'dynamic' })}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        state.newListType === 'dynamic'
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Filter className={`w-5 h-5 mb-1 ${state.newListType === 'dynamic' ? 'text-violet-600' : 'text-gray-400'}`} />
                      <div className="font-medium text-gray-900 dark:text-white text-sm">Dynamique</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Basée sur filtres</div>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => dispatch({ type: "CLOSE_CREATE_MODAL" })}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  data-testid="btn-submit-create"
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !state.newListName.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
                >
                  {createMutation.isPending ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Import CSV */}
        <Modal
          isOpen={state.showImportModal}
          onClose={resetImportModal}
          title="Importer des contacts"
          size="lg"
        >
          <div className="p-6 space-y-6">
            {/* Step: Upload */}
            {state.importStep === 'upload' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 dark:hover:border-violet-500 transition"
                >
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    Cliquez pour sélectionner un fichier CSV
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Colonnes attendues : Nom, Email, Téléphone
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {previewMutation.isPending && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Analyse du fichier...</p>
                  </div>
                )}
              </div>
            )}

            {/* Step: Preview */}
            {state.importStep === 'preview' && state.csvPreview && (
              <div className="space-y-4">
                {/* File info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-violet-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{state.csvFileName}</p>
                    <p className="text-sm text-gray-500">{state.csvPreview.total_rows} lignes détectées</p>
                  </div>
                </div>

                {/* Column mapping */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Correspondance des colonnes
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Nom</label>
                      <select
                        value={state.columnMapping.name || ''}
                        onChange={(e) => dispatch({ type: "SET_COLUMN_MAPPING", payload: { ...state.columnMapping, name: e.target.value } })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">-- Non mappé --</option>
                        {state.csvPreview.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                      <select
                        value={state.columnMapping.email || ''}
                        onChange={(e) => dispatch({ type: "SET_COLUMN_MAPPING", payload: { ...state.columnMapping, email: e.target.value } })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">-- Non mappé --</option>
                        {state.csvPreview.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Téléphone</label>
                      <select
                        value={state.columnMapping.phone || ''}
                        onChange={(e) => dispatch({ type: "SET_COLUMN_MAPPING", payload: { ...state.columnMapping, phone: e.target.value } })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">-- Non mappé --</option>
                        {state.csvPreview.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Preview table */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Aperçu (10 premières lignes)
                  </h4>
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nom</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Téléphone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {state.csvPreview.preview.map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                              {row._raw[state.columnMapping.name || ''] || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                              {row._raw[state.columnMapping.email || ''] || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                              {row._raw[state.columnMapping.phone || ''] || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Target list */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Liste de destination
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={!state.importListId}
                          onChange={() => dispatch({ type: "SET_IMPORT_LIST_ID", payload: null })}
                          className="text-violet-600"
                        />
                        <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Créer une nouvelle liste</span>
                      </label>
                      {!state.importListId && (
                        <input
                          type="text"
                          value={state.importListName}
                          onChange={(e) => dispatch({ type: "SET_IMPORT_LIST_NAME", payload: e.target.value })}
                          placeholder="Nom de la nouvelle liste"
                          className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                        />
                      )}
                    </div>
                    {lists.length > 0 && (
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={!!state.importListId}
                            onChange={() => dispatch({ type: "SET_IMPORT_LIST_ID", payload: lists[0]?.id || null })}
                            className="text-violet-600"
                          />
                          <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Ajouter à une liste existante</span>
                        </label>
                        {state.importListId && (
                          <select
                            value={state.importListId}
                            onChange={(e) => dispatch({ type: "SET_IMPORT_LIST_ID", payload: Number(e.target.value) })}
                            className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          >
                            {lists.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.name} ({list.contact_count} contacts)
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Result */}
            {state.importStep === 'result' && state.importResult && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Import terminé
                </h3>
                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{state.importResult.created}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Créés</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{state.importResult.updated}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mis à jour</p>
                  </div>
                </div>

                {state.importResult.errors.length > 0 && (
                  <div className="text-left bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{state.importResult.errors.length} erreur(s)</span>
                    </div>
                    <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-1">
                      {state.importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            {state.importStep === 'upload' && (
              <button
                onClick={resetImportModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Annuler
              </button>
            )}
            {state.importStep === 'preview' && (
              <>
                <button
                  onClick={() => dispatch({ type: "SET_IMPORT_STEP", payload: 'upload' })}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Retour
                </button>
                <button
                  onClick={handleImport}
                  disabled={importMutation.isPending || (!state.importListName && !state.importListId)}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
                >
                  {importMutation.isPending ? 'Import en cours...' : `Importer ${state.csvPreview?.total_rows || 0} contacts`}
                </button>
              </>
            )}
            {state.importStep === 'result' && (
              <button
                onClick={resetImportModal}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
              >
                Terminé
              </button>
            )}
          </div>
        </Modal>

        <ConfirmModal
          isOpen={state.deleteId !== null}
          onClose={() => dispatch({ type: "SET_DELETE_ID", payload: null })}
          onConfirm={handleDelete}
          title="Supprimer la liste"
          message="Êtes-vous sûr de vouloir supprimer cette liste ? Cette action est irréversible."
          confirmText="Supprimer"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
}
