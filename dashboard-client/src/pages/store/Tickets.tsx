import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { MessageSquare, Clock, User, Filter, Send, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useModule } from '@/components/ModularLayout';

interface Ticket {
  id: number;
  reference: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  orderName: string | null;
  category: string;
  priority: string;
  state: string;
  assignedTo: string | null;
  messageCount: number;
  responseTime: number;
  createdAt: string;
}

interface TicketMessage {
  id: number;
  authorName: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
}

export default function Tickets() {
  const { setTitle } = useModule();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ state: '', priority: '', category: '' });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    setTitle('Support / SAV');
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      const params: Record<string, string> = {};
      if (filter.state) params.state = filter.state;
      if (filter.priority) params.priority = filter.priority;
      if (filter.category) params.category = filter.category;

      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params }),
      });
      const data = await res.json();
      if (data.result?.success) {
        setTickets(data.result.tickets);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
      });
      const data = await res.json();
      if (data.result?.success) {
        setSelectedTicket(data.result.ticket);
        setMessages(data.result.ticket.messages || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { content: replyText } }),
      });
      const data = await res.json();
      if (data.result?.success) {
        setReplyText('');
        fetchTicketDetail(selectedTicket.id);
        fetchTickets();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateStatus = async (state: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { state } }),
      });
      const data = await res.json();
      if (data.result?.success) {
        fetchTicketDetail(selectedTicket.id);
        fetchTickets();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'pending': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'new': return 'Nouveau';
      case 'open': return 'En cours';
      case 'pending': return 'En attente';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Fermé';
      default: return state;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      order: 'Commande',
      product: 'Produit',
      delivery: 'Livraison',
      return: 'Retour',
      refund: 'Remboursement',
      payment: 'Paiement',
      account: 'Compte',
      other: 'Autre',
    };
    return labels[category] || category;
  };

  const stats = {
    new: tickets.filter(t => t.state === 'new').length,
    open: tickets.filter(t => t.state === 'open').length,
    pending: tickets.filter(t => t.state === 'pending').length,
    avgResponse: tickets.length > 0
      ? (tickets.reduce((sum, t) => sum + t.responseTime, 0) / tickets.length).toFixed(1)
      : '0',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Tickets List */}
      <div className="w-96 flex-shrink-0 flex flex-col">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
            <p className="text-lg font-bold text-blue-600">{stats.new}</p>
            <p className="text-xs text-blue-600">Nouveaux</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-center">
            <p className="text-lg font-bold text-yellow-600">{stats.open}</p>
            <p className="text-xs text-yellow-600">En cours</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
            <p className="text-lg font-bold text-purple-600">{stats.pending}</p>
            <p className="text-xs text-purple-600">En attente</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center">
            <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{stats.avgResponse}h</p>
            <p className="text-xs text-gray-500">Moy. réponse</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select
            value={filter.state}
            onChange={(e) => setFilter({ ...filter, state: e.target.value })}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Tous statuts</option>
            <option value="new">Nouveau</option>
            <option value="open">En cours</option>
            <option value="pending">En attente</option>
            <option value="resolved">Résolu</option>
          </select>
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Priorité</option>
            <option value="urgent">Urgente</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => fetchTicketDetail(ticket.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTicket?.id === ticket.id
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono text-gray-500">{ticket.reference}</span>
                <span className={`px-1.5 py-0.5 text-xs rounded ${getStateColor(ticket.state)}`}>
                  {getStateLabel(ticket.state)}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">
                {ticket.subject}
              </h4>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {ticket.customerName}
                </span>
                <span className={`flex items-center gap-1 ${getPriorityColor(ticket.priority)}`}>
                  <AlertCircle className="w-3 h-3" />
                  {ticket.priority}
                </span>
              </div>
            </div>
          ))}

          {tickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun ticket
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded ${getStateColor(selectedTicket.state)}`}>
                      {getStateLabel(selectedTicket.state)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedTicket.reference} • {getCategoryLabel(selectedTicket.category)}
                    {selectedTicket.orderName && ` • Commande ${selectedTicket.orderName}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.state !== 'resolved' && (
                    <button
                      onClick={() => updateStatus('resolved')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Résoudre
                    </button>
                  )}
                  {selectedTicket.state !== 'closed' && (
                    <button
                      onClick={() => updateStatus('closed')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-200"
                    >
                      <XCircle className="w-4 h-4" />
                      Fermer
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{selectedTicket.customerName}</span>
                <span>{selectedTicket.customerEmail}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isStaff ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.isStaff
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">{message.authorName}</p>
                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }} />
                    <p className={`text-xs mt-2 ${message.isStaff ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(message.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply */}
            {selectedTicket.state !== 'closed' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Votre réponse..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim()}
                    className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Sélectionnez un ticket</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
