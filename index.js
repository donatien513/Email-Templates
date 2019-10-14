"use strict";

const requireStaticAssets = (module, filePath) => {
  module.exports = readFileSync(filePath, "utf8")
}

require.extensions[".css"] = requireStaticAssets
require.extensions[".html"] = requireStaticAssets

// Modules declarations
const ejs = require("ejs")
const path = require("path")
const juice = require("juice")
const cheerio = require("cheerio")
const express = require("express")
const mustache = require("mustache")
const { readFileSync } = require("fs")
const { minify } = require("html-minifier")
const { unescape } = require("html-escaper")
const { celebrate, Joi, errors } = require("celebrate")

const organization = require("./organization")

const loadRawTemplate = (filename) => {
  let resolvedFilepath = path.resolve(process.cwd(), "templates", filename)
  return readFileSync(resolvedFilepath, "utf8")
}

const app = express()
const tachyons = require("tachyons/css/tachyons.css")
const layout = loadRawTemplate("layout.html")

const loadRenderer = (templateFilename) => {
  let template = loadRawTemplate(templateFilename)
  let withinLayout = mustache.render(layout, {
    content: template,
    css: tachyons,
    organization
  })
  let inlinedCSS = juice(withinLayout)
  const $ = cheerio.load(inlinedCSS)
  $("style").remove()
  $("*").removeAttr("class")
  let unescaped = unescape($.html())
  let minified = minify(unescaped, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    minifyCSS: true,
    removeComments: true,
  })
  let ejsFunc = ejs.compile(minified)
  return ejsFunc
}

const routes = [
  {
    path: "/verify-email-ownership",
    validationRule: {
      body: Joi.object().keys({
        validationLink: Joi.string().required()
      })
    },
    renderer: loadRenderer("verify-email-ownership.html")
  }
]

routes.forEach(route => {
  app.post(route.path,
    celebrate(route.validationRule),
    (req, res, next) => {
      let rendered = route.renderer(req.body)
      res.send(rendered)
      next()
    }
  )
})

app.use(errors())

module.exports = app
