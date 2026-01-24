# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError
from .base_controller import BaseEcommerceController
from datetime import datetime
import logging
import re
import html

_logger = logging.getLogger(__name__)


class ContactController(BaseEcommerceController):
    """Controller pour le formulaire de contact."""

    def _validate_email(self, email):
        """Valide le format d'une adresse email."""
        if not email:
            return False
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def _sanitize_input(self, text):
        """Nettoie les entrees utilisateur pour eviter les injections."""
        if not text:
            return ''
        return html.escape(str(text).strip())

    @http.route(
        '/api/ecommerce/contact',
        type='json',
        auth='public',
        methods=['POST'],
        csrf=False
    )
    def submit_contact_form(self, **kwargs):
        """
        Traite la soumission du formulaire de contact.

        Args:
            name (str): Nom de l'expediteur (requis)
            email (str): Email de l'expediteur (requis)
            phone (str): Telephone (optionnel)
            subject (str): Sujet du message (requis)
            message (str): Corps du message (requis)

        Returns:
            dict: Reponse standardisee avec success/error
        """
        try:
            # Valider les parametres requis
            required_fields = ['name', 'email', 'subject', 'message']
            self._validate_required_params(kwargs, required_fields)

            # Recuperer et nettoyer les donnees
            name = self._sanitize_input(kwargs.get('name', ''))
            email = kwargs.get('email', '').strip().lower()
            phone = self._sanitize_input(kwargs.get('phone', ''))
            subject = self._sanitize_input(kwargs.get('subject', ''))
            message = self._sanitize_input(kwargs.get('message', ''))

            # Validation email
            if not self._validate_email(email):
                raise ValidationError("L'adresse email n'est pas valide.")

            # Validation longueur message
            if len(message) < 10:
                raise ValidationError("Le message doit contenir au moins 10 caracteres.")

            if len(message) > 5000:
                raise ValidationError("Le message ne doit pas depasser 5000 caracteres.")

            # Recuperer la configuration pour les destinataires
            config = request.env['ecommerce.config'].sudo().search([], limit=1)
            if not config:
                config = request.env['ecommerce.config'].sudo().create({})

            recipients = config.contact_form_recipients or config.brand_email
            if not recipients:
                _logger.error("Aucun email de destination configure pour le formulaire de contact")
                raise ValidationError("Le formulaire de contact n'est pas configure correctement.")

            # Envoyer l'email
            self._send_contact_email(
                recipients=recipients,
                sender_name=name,
                sender_email=email,
                sender_phone=phone,
                subject=subject,
                message=message
            )

            _logger.info(f"Message de contact envoye - De: {email}, Sujet: {subject}")

            return self._success_response(
                message="Votre message a ete envoye avec succes. Nous vous repondrons dans les plus brefs delais."
            )

        except ValidationError as e:
            return self._handle_error(e, "envoi du message de contact")
        except Exception as e:
            _logger.exception("Erreur lors de l'envoi du message de contact")
            return self._handle_error(e, "envoi du message de contact")

    def _send_contact_email(self, recipients, sender_name, sender_email, sender_phone, subject, message):
        """
        Envoie l'email de contact aux destinataires configures.

        Args:
            recipients: Emails de destination (separes par virgules)
            sender_name: Nom de l'expediteur
            sender_email: Email de l'expediteur
            sender_phone: Telephone de l'expediteur (optionnel)
            subject: Sujet du message
            message: Corps du message
        """
        try:
            # Essayer d'utiliser le template
            template = request.env.ref(
                'quelyos_ecommerce.email_template_contact_form',
                raise_if_not_found=False
            )

            # Contexte pour le template
            ctx = {
                'sender_name': sender_name,
                'sender_email': sender_email,
                'sender_phone': sender_phone,
                'contact_subject': subject,
                'message_body': message,
                'contact_date': datetime.now().strftime('%d/%m/%Y a %H:%M'),
                'recipients': recipients,
            }

            if template:
                # Utiliser le template
                template.with_context(ctx).send_mail(
                    res_id=request.env.user.partner_id.id,
                    force_send=True,
                    raise_exception=True,
                    email_values={
                        'email_to': recipients,
                        'email_from': sender_email,
                        'subject': f"Nouveau message de contact - {subject}",
                    }
                )
            else:
                # Fallback: envoi direct sans template
                self._send_direct_email(
                    recipients, sender_name, sender_email,
                    sender_phone, subject, message
                )

        except Exception as e:
            _logger.exception(f"Erreur lors de l'envoi de l'email de contact: {str(e)}")
            raise ValidationError("Une erreur est survenue lors de l'envoi du message. Veuillez reessayer.")

    def _send_direct_email(self, recipients, sender_name, sender_email, sender_phone, subject, message):
        """
        Envoie un email directement sans template (fallback).
        """
        phone_html = f'<p><strong>Telephone:</strong> {sender_phone}</p>' if sender_phone else ''
        message_html = message.replace('\n', '<br/>')

        mail_values = {
            'subject': f"Nouveau message de contact - {subject}",
            'email_from': sender_email,
            'email_to': recipients,
            'body_html': f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #01613a; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Nouveau message de contact</h2>
                    </div>
                    <div style="padding: 20px; background: #f9f9f9;">
                        <p><strong>De:</strong> {sender_name} ({sender_email})</p>
                        {phone_html}
                        <p><strong>Sujet:</strong> {subject}</p>
                        <p><strong>Date:</strong> {datetime.now().strftime('%d/%m/%Y a %H:%M')}</p>
                        <hr style="border: 1px solid #ddd;"/>
                        <h3>Message:</h3>
                        <p>{message_html}</p>
                    </div>
                    <div style="padding: 15px; background: #eee; text-align: center; font-size: 12px; color: #666;">
                        Message recu via le formulaire de contact - Quelyos
                    </div>
                </div>
            """,
        }

        mail = request.env['mail.mail'].sudo().create(mail_values)
        mail.send(raise_exception=True)
