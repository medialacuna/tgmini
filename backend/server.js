const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`HEARTWINS Telegram Mini App server running on port ${PORT}`);
});
