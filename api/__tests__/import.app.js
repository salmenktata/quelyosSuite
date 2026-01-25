// ...existing code...
const express = require('express');
const importRoute = require('./import.router');

const app = express();
app.use(express.json());
app.use(importRoute);

// Handler d'erreur Express pour multer (413) et MIME (415)
app.use((err, req, res, next) => {
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(413).json({ error: 'Fichier trop volumineux (>10 Mo)' });
	}
	if (err.message && err.message.includes('Type de fichier non supporté')) {
		return res.status(415).json({ error: err.message });
	}
	return res.status(500).json({ error: 'Erreur serveur', details: err.message });
});

module.exports = app;
