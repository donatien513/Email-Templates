"use strict";

const requireStaticAssets = (module, filePath) => {
  let resolvedFilepath = path.resolve(process.cwd(), filePath)
  module.exports = readFileSync(resolvedFilepath, "utf8");
};

require.extensions[".css"] = requireStaticAssets
require.extensions[".html"] = requireStaticAssets

// Modules declarations
const express = require("express")
const ejs = require("ejs");
const path = require("path");
const juice = require("juice");
const cheerio = require("cheerio");
const mustache = require("mustache");
const { readFileSync } = require("fs");
const { minify } = require("html-minifier");
const { unescape } = require("html-escaper");
const { celebrate, Joi, errors } = require("celebrate");

const app = express()
const tachyons = require("tachyons/css/tachyons.css");
const layout = require("./templates/layout.html");

const loadRenderer = (templatePath) => {
  let template = require(templatePath)
  let withinLayout = mustache.render(layout, {
    content: template,
    css: tachyons
  })
  let withCSS = mustache.render(withinLayout, {  })
  let inlinedCSS = juice(withCSS)
  const $ = cheerio.load(inlinedCSS);
  $("style").remove()
  $("*").removeAttr("class");
  let unescaped = unescape($.html());
  let ejsFunc = ejs.compile(unescaped)
  return ejsFunc
}

const routes = [
  {
    path: "/verify-email-ownership",
    validationRule: { body: {} },
    renderer: loadRenderer("./templates/verify-email-ownership.html")
  }
]

routes.forEach(route => {
  app.get(route.path,
    celebrate(route.validationRule),
    (req, res, next) => {
      let rendered = route.renderer(req.body);
      res.send(rendered)
      next()
    }
  )
  app.post(route.path,
    celebrate(route.validationRule),
    (req, res, next) => {
      let rendered = route.renderer(req.body);
      res.send(rendered)
      next()
    }
  )
})

app.use(errors())

module.exports = app;
