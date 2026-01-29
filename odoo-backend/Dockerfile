# Dockerfile Backend API (Odoo 19 + quelyos_api module)
FROM odoo:19

USER root

# Copy requirements.txt pour installer toutes les dépendances Python
COPY ./addons/quelyos_api/requirements.txt /tmp/quelyos_requirements.txt

# Install Python packages from requirements.txt + packages additionnels
RUN pip3 install --break-system-packages --no-cache-dir --ignore-installed \
    -r /tmp/quelyos_requirements.txt \
    prometheus-client \
    sentry-sdk \
    pyjwt \
    python-dateutil && \
    rm /tmp/quelyos_requirements.txt

# Copy custom addons
COPY --chown=odoo:odoo ./addons /mnt/extra-addons

# Create necessary directories
RUN mkdir -p /var/lib/odoo && \
    chown -R odoo:odoo /var/lib/odoo

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8069/web/health || exit 1

USER odoo

EXPOSE 8069

# Use default Odoo entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["odoo"]
