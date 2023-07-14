const { data } = require('../config/config_exports')

const express = require('express');

const public_router = express.Router();

public_router.get('/hmt/index.html', async(req, res) => {
  res.status(200).send('Bwing project. cabin on.');
});

public_router.get('/', async(req, res) => {
  res.status(200).send('Welcome to Cabin Service');
});

public_router.get('/hmt/get/config', async(req, res) => {
  if (!req.query.token) {
    res.status(200).send('Validation IsValue error. token');
  } else if (!req.query.version) {
      res.status(200).send('Validation IsValue error. version');
  } else if (req.query.token != data.keel_auth.token) {
    res.status(200).send('Validation OAuth error. token');
  } else if (req.query.version != data.version) {
    res.status(200).send('Validation Match error. version');
  } else {
    res.status(200).json(data);
  }
});

module.exports = {
  public_router,
};