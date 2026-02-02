'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface FAQ {
  keywords: string[];
  question: string;
  answer: string;
}

// Base de connaissances FAQ
const FAQ_DATABASE: FAQ[] = [
  {
    keywords: ['livraison', 'delai', 'expedition', 'envoyer', 'recevoir'],
    question: 'Quels sont les delais de livraison ?',
    answer: 'Les commandes sont expedies sous 24-48h. La livraison standard prend 3-5 jours ouvrables. La livraison express est disponible en 24h pour les grandes villes.',
  },
  {
    keywords: ['retour', 'rembourser', 'echanger', 'satisfait'],
    question: 'Comment retourner un produit ?',
    answer: 'Vous disposez de 30 jours pour retourner un article. Connectez-vous a votre compte, allez dans "Mes commandes" et selectionnez "Demander un retour". Les frais de retour sont gratuits.',
  },
  {
    keywords: ['paiement', 'payer', 'carte', 'paypal', 'virement'],
    question: 'Quels modes de paiement acceptez-vous ?',
    answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et le paiement a la livraison. Tous les paiements sont securises.',
  },
  {
    keywords: ['commande', 'suivi', 'suivre', 'track', 'ou est'],
    question: 'Comment suivre ma commande ?',
    answer: 'Connectez-vous a votre compte et accedez a "Mes commandes". Vous y trouverez le numero de suivi et un lien vers le site du transporteur.',
  },
  {
    keywords: ['compte', 'inscription', 'creer', 'mot de passe', 'connecter'],
    question: 'Comment creer un compte ?',
    answer: 'Cliquez sur "Se connecter" en haut de page, puis sur "Creer un compte". Remplissez le formulaire avec votre email et un mot de passe securise.',
  },
  {
    keywords: ['promo', 'code', 'reduction', 'coupon', 'remise'],
    question: 'Comment utiliser un code promo ?',
    answer: 'Ajoutez vos articles au panier, puis dans l\'ecran de paiement, entrez votre code promo dans le champ dedie et cliquez sur "Appliquer".',
  },
  {
    keywords: ['contact', 'joindre', 'telephone', 'email', 'assistance'],
    question: 'Comment contacter le service client ?',
    answer: 'Notre service client est disponible par email a support@example.com ou par telephone au +216 XX XXX XXX du lundi au vendredi de 9h a 18h.',
  },
  {
    keywords: ['stock', 'disponible', 'rupture', 'alerte'],
    question: 'Comment etre alerte du retour en stock ?',
    answer: 'Sur la page du produit en rupture, cliquez sur "Me prevenir" et entrez votre email. Vous serez notifie des que le produit sera de nouveau disponible.',
  },
  {
    keywords: ['fidélité', 'points', 'programme', 'avantages'],
    question: 'Comment fonctionne le programme fidelite ?',
    answer: 'Chaque achat vous rapporte des points. 1 euro = 1 point. Accumulez des points pour debloquer des reductions exclusives et des avantages membres.',
  },
  {
    keywords: ['taille', 'guide', 'mesure', 'dimension'],
    question: 'Comment trouver ma taille ?',
    answer: 'Consultez notre guide des tailles disponible sur chaque page produit. Mesurez-vous selon nos indications pour trouver la taille parfaite.',
  },
];

// Suggestions rapides
const QUICK_SUGGESTIONS = [
  'Delais de livraison',
  'Retourner un produit',
  'Suivre ma commande',
  'Modes de paiement',
  'Contacter le support',
];

function findBestAnswer(query: string): FAQ | null {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  let bestMatch: FAQ | null = null;
  let bestScore = 0;

  for (const faq of FAQ_DATABASE) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (queryLower.includes(keyword)) {
        score += 3;
      }
      for (const word of queryWords) {
        if (keyword.includes(word) || word.includes(keyword)) {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
}

export function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message de bienvenue
      setMessages([{
        id: '0',
        type: 'bot',
        text: 'Bonjour ! Je suis l\'assistant FAQ. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const messageIdRef = React.useRef(0);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: String(++messageIdRef.current),
      type: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simuler un delai de reponse
    await new Promise(resolve => setTimeout(resolve, 800));

    // Trouver la meilleure reponse
    const faq = findBestAnswer(messageText);
    const botResponse: Message = {
      id: String(++messageIdRef.current),
      type: 'bot',
      text: faq
        ? faq.answer
        : 'Je n\'ai pas trouve de reponse a votre question. Essayez de reformuler ou contactez notre service client pour plus d\'aide.',
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botResponse]);
  };

  const handleQuickSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
        aria-label="Ouvrir le chat"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {/* Indicateur */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </button>

      {/* Fenetre de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Assistant FAQ</h3>
                <p className="text-xs text-white/80">Reponse instantanee</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Questions frequentes :</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-white border-t border-gray-200"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
