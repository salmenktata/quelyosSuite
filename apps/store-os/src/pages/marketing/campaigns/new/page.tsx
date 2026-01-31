import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs } from '@/components/common';
import { useCreateCampaign } from '@/hooks/useMarketingCampaigns';
import { useContactLists } from '@/hooks/useContactLists';
import { useEmailTemplates, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/hooks/useEmailTemplates';
import { useToast } from '@/contexts/ToastContext';
import {
  Mail,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Users,
  Clock,
  Send,
  Check,
  FileText,
  Sparkles,
} from 'lucide-react';

type Step = 'channel' | 'content' | 'recipients' | 'schedule' | 'review';

export default function NewCampaignPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createMutation = useCreateCampaign();
  const { data: listsData } = useContactLists();
  const { data: templates } = useEmailTemplates();

  const [step, setStep] = useState<Step>('channel');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [useTemplate, setUseTemplate] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    channel: '' as 'email' | 'sms' | '',
    subject: '',
    content: '',
    sms_message: '',
    contact_list_id: null as number | null,
    scheduled_date: '',
    sendNow: true,
  });

  const contactLists = listsData?.lists || [];

  const steps: { key: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'channel', label: 'Canal', icon: Mail },
    { key: 'content', label: 'Contenu', icon: MessageSquare },
    { key: 'recipients', label: 'Destinataires', icon: Users },
    { key: 'schedule', label: 'Planification', icon: Clock },
    { key: 'review', label: 'Aperçu', icon: Check },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  const canProceed = () => {
    switch (step) {
      case 'channel':
        return !!formData.channel && !!formData.name;
      case 'content':
        if (formData.channel === 'email') {
          return !!formData.subject && !!formData.content;
        }
        return !!formData.sms_message;
      case 'recipients':
        return !!formData.contact_list_id;
      case 'schedule':
        return formData.sendNow || !!formData.scheduled_date;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const idx = stepIndex + 1;
    if (idx < steps.length) {
      setStep(steps[idx].key);
    }
  };

  const prevStep = () => {
    const idx = stepIndex - 1;
    if (idx >= 0) {
      setStep(steps[idx].key);
    }
  };

  const handleSubmit = async () => {
    try {
      const campaign = await createMutation.mutateAsync({
        name: formData.name,
        channel: formData.channel as 'email' | 'sms',
        subject: formData.subject || undefined,
        content: formData.content || undefined,
        sms_message: formData.sms_message || undefined,
        contact_list_id: formData.contact_list_id || undefined,
        scheduled_date: formData.sendNow ? undefined : formData.scheduled_date || undefined,
      });
      toast.success('Campagne créée avec succès');
      navigate(`/marketing/campaigns/${campaign.id}`);
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const selectedList = contactLists.find((l) => l.id === formData.contact_list_id);

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campagnes', href: '/marketing/campaigns' },
            { label: 'Nouvelle campagne' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouvelle campagne
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Créez une campagne email ou SMS en quelques étapes
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.key;
            const isCompleted = stepIndex > idx;

            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      isActive
                        ? 'bg-pink-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-xs mt-2 ${
                      isActive
                        ? 'text-pink-600 dark:text-pink-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      stepIndex > idx ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Step: Channel */}
          {step === 'channel' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Nom de la campagne *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Newsletter Janvier 2026"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-3">
                  Canal de diffusion *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, channel: 'email' })}
                    className={`p-6 rounded-xl border-2 transition ${
                      formData.channel === 'email'
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Mail className={`w-8 h-8 mb-3 ${formData.channel === 'email' ? 'text-pink-600' : 'text-gray-400'}`} />
                    <h3 className="font-medium text-gray-900 dark:text-white">Email</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Newsletters, promotions
                    </p>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, channel: 'sms' })}
                    className={`p-6 rounded-xl border-2 transition ${
                      formData.channel === 'sms'
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <MessageSquare className={`w-8 h-8 mb-3 ${formData.channel === 'sms' ? 'text-pink-600' : 'text-gray-400'}`} />
                    <h3 className="font-medium text-gray-900 dark:text-white">SMS</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Messages directs
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step: Content */}
          {step === 'content' && formData.channel === 'email' && (
            <div className="space-y-6">
              {/* Toggle template vs manuel */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setUseTemplate(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                    useTemplate
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Utiliser un template
                </button>
                <button
                  onClick={() => setUseTemplate(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                    !useTemplate
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Rédiger manuellement
                </button>
              </div>

              {/* Template selection */}
              {useTemplate && (
                <>
                  {/* Category filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                      Catégorie
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          selectedCategory === 'all'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Tous
                      </button>
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setSelectedCategory(cat.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                            selectedCategory === cat.key
                              ? cat.color
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template grid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                      Choisir un template
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {(templates || [])
                        .filter((t) => selectedCategory === 'all' || t.category === selectedCategory)
                        .map((template) => {
                          const catInfo = TEMPLATE_CATEGORIES.find((c) => c.key === template.category);
                          const isSelected =
                            formData.subject === template.subject && formData.content === template.content;
                          return (
                            <button
                              key={template.id}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  subject: template.subject,
                                  content: template.content,
                                })
                              }
                              className={`p-3 text-left rounded-lg border-2 transition ${
                                isSelected
                                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                  {template.name}
                                </h4>
                                {isSelected && <Check className="w-4 h-4 text-pink-600 flex-shrink-0" />}
                              </div>
                              {catInfo && (
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${catInfo.color}`}>
                                  {catInfo.label}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    {(templates || []).filter((t) => selectedCategory === 'all' || t.category === selectedCategory)
                      .length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Aucun template dans cette catégorie
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Subject field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Objet de l'email *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Découvrez nos offres du mois !"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Content field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Contenu de l'email *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Rédigez le contenu de votre email..."
                  rows={useTemplate ? 6 : 10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Variables disponibles : {'{{prenom}}'}, {'{{nom}}'}, {'{{email}}'}, {'{{company}}'}, {'{{site_url}}'}
                </p>
              </div>
            </div>
          )}

          {step === 'content' && formData.channel === 'sms' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Message SMS *
                </label>
                <textarea
                  value={formData.sms_message}
                  onChange={(e) => setFormData({ ...formData, sms_message: e.target.value })}
                  placeholder="Rédigez votre message SMS..."
                  rows={4}
                  maxLength={160}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>Variables : {'{{prenom}}'}, {'{{nom}}'}</span>
                  <span>{formData.sms_message.length}/160 caractères</span>
                </div>
              </div>
            </div>
          )}

          {/* Step: Recipients */}
          {step === 'recipients' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Liste de contacts *
                </label>
                {contactLists.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 mb-3">Aucune liste de contacts</p>
                    <button
                      onClick={() => navigate('/marketing/contacts')}
                      className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                    >
                      Créer une liste
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contactLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => setFormData({ ...formData, contact_list_id: list.id })}
                        className={`w-full p-4 text-left rounded-lg border-2 transition ${
                          formData.contact_list_id === list.id
                            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{list.name}</h4>
                            {list.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{list.description}</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {list.contact_count} contacts
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Schedule */}
          {step === 'schedule' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-3">
                  Quand envoyer cette campagne ?
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setFormData({ ...formData, sendNow: true })}
                    className={`w-full p-4 text-left rounded-lg border-2 transition ${
                      formData.sendNow
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Send className={`w-5 h-5 ${formData.sendNow ? 'text-pink-600' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Envoyer maintenant</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">La campagne sera envoyée immédiatement</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, sendNow: false })}
                    className={`w-full p-4 text-left rounded-lg border-2 transition ${
                      !formData.sendNow
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className={`w-5 h-5 ${!formData.sendNow ? 'text-pink-600' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Planifier</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Choisir une date et heure d'envoi</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {!formData.sendNow && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Date et heure d'envoi
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Récapitulatif de la campagne
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Nom</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Canal</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">{formData.channel}</span>
                </div>
                {formData.channel === 'email' && (
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Objet</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.subject}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Destinataires</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedList ? `${selectedList.name} (${selectedList.contact_count})` : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Envoi</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.sendNow ? 'Immédiat' : new Date(formData.scheduled_date).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              {formData.channel === 'email' && formData.content && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">Aperçu du contenu</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div
                      className="text-sm text-gray-600 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content) }}
                    />
                  </div>
                </div>
              )}

              {formData.channel === 'sms' && formData.sms_message && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">Aperçu du message</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{formData.sms_message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={stepIndex === 0 ? () => navigate('/marketing/campaigns') : prevStep}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              {stepIndex === 0 ? 'Annuler' : 'Précédent'}
            </button>

            {step === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition"
              >
                {createMutation.isPending ? 'Création...' : 'Créer la campagne'}
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
