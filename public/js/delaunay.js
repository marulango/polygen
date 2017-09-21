/**

The MIT License (MIT)

Copyright (c) 2014 Maksim Surguy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

**/
var Delaunay;

(function () {
  'use strict'

  var EPSILON = 1.0 / 1048576.0

  function supertriangle (vertices) {
    var xmin = Number.POSITIVE_INFINITY,
      ymin = Number.POSITIVE_INFINITY,
      xmax = Number.NEGATIVE_INFINITY,
      ymax = Number.NEGATIVE_INFINITY,
      i, dx, dy, dmax, xmid, ymid

    for (i = vertices.length; i--;) {
      if (vertices[i][0] < xmin) xmin = vertices[i][0]
      if (vertices[i][0] > xmax) xmax = vertices[i][0]
      if (vertices[i][1] < ymin) ymin = vertices[i][1]
      if (vertices[i][1] > ymax) ymax = vertices[i][1]
    }

    dx = xmax - xmin
    dy = ymax - ymin
    dmax = Math.max(dx, dy)
    xmid = xmin + dx * 0.5
    ymid = ymin + dy * 0.5

    return [
      [xmid - 20 * dmax, ymid - dmax],
      [xmid, ymid + 20 * dmax],
      [xmid + 20 * dmax, ymid - dmax]
    ]
  }

  function circumcircle (vertices, i, j, k) {
    var x1 = vertices[i][0],
      y1 = vertices[i][1],
      x2 = vertices[j][0],
      y2 = vertices[j][1],
      x3 = vertices[k][0],
      y3 = vertices[k][1],
      fabsy1y2 = Math.abs(y1 - y2),
      fabsy2y3 = Math.abs(y2 - y3),
      xc, yc, m1, m2, mx1, mx2, my1, my2, dx, dy

    /* Check for coincident points */
    if (fabsy1y2 < EPSILON && fabsy2y3 < EPSILON) { throw new Error('Eek! Coincident points!') }

    if (fabsy1y2 < EPSILON) {
      m2 = -((x3 - x2) / (y3 - y2))
      mx2 = (x2 + x3) / 2.0
      my2 = (y2 + y3) / 2.0
      xc = (x2 + x1) / 2.0
      yc = m2 * (xc - mx2) + my2
    } else if (fabsy2y3 < EPSILON) {
      m1 = -((x2 - x1) / (y2 - y1))
      mx1 = (x1 + x2) / 2.0
      my1 = (y1 + y2) / 2.0
      xc = (x3 + x2) / 2.0
      yc = m1 * (xc - mx1) + my1
    } else {
      m1 = -((x2 - x1) / (y2 - y1))
      m2 = -((x3 - x2) / (y3 - y2))
      mx1 = (x1 + x2) / 2.0
      mx2 = (x2 + x3) / 2.0
      my1 = (y1 + y2) / 2.0
      my2 = (y2 + y3) / 2.0
      xc = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2)
      yc = (fabsy1y2 > fabsy2y3)
        ? m1 * (xc - mx1) + my1
        : m2 * (xc - mx2) + my2
    }

    dx = x2 - xc
    dy = y2 - yc
    return {i: i, j: j, k: k, x: xc, y: yc, r: dx * dx + dy * dy}
  }

  function dedup (edges) {
    var i, j, a, b, m, n

    for (j = edges.length; j;) {
      b = edges[--j]
      a = edges[--j]

      for (i = j; i;) {
        n = edges[--i]
        m = edges[--i]

        if ((a === m && b === n) || (a === n && b === m)) {
          edges.splice(j, 2)
          edges.splice(i, 2)
          break
        }
      }
    }
  }

  Delaunay = {
    triangulate: function (vertices, key) {
      var n = vertices.length,
        i, j, indices, st, open, closed, edges, dx, dy, a, b, c

      /* Bail if there aren't enough vertices to form any triangles. */
      if (n < 3) { return [] }

      /* Slice out the actual vertices from the passed objects. (Duplicate the
       * array even if we don't, though, since we need to make a supertriangle
       * later on!) */
      vertices = vertices.slice(0)

      if (key) {
        for (i = n; i--;) { vertices[i] = vertices[i][key] }
      }

      /* Make an array of indices into the vertex array, sorted by the
       * vertices' x-position. */
      indices = new Array(n)

      for (i = n; i--;) { indices[i] = i }

      indices.sort(function (i, j) {
        return vertices[j][0] - vertices[i][0]
      })

      /* Next, find the vertices of the supertriangle (which contains all other
       * triangles), and append them onto the end of a (copy of) the vertex
       * array. */
      st = supertriangle(vertices)
      vertices.push(st[0], st[1], st[2])

      /* Initialize the open list (containing the supertriangle and nothing
       * else) and the closed list (which is empty since we havn't processed
       * any triangles yet). */
      open = [circumcircle(vertices, n + 0, n + 1, n + 2)]
      closed = []
      edges = []

      /* Incrementally add each vertex to the mesh. */
      for (i = indices.length; i--; edges.length = 0) {
        c = indices[i]

        /* For each open triangle, check to see if the current point is
         * inside it's circumcircle. If it is, remove the triangle and add
         * it's edges to an edge list. */
        for (j = open.length; j--;) {
          /* If this point is to the right of this triangle's circumcircle,
           * then this triangle should never get checked again. Remove it
           * from the open list, add it to the closed list, and skip. */
          dx = vertices[c][0] - open[j].x
          if (dx > 0.0 && dx * dx > open[j].r) {
            closed.push(open[j])
            open.splice(j, 1)
            continue
          }

          /* If we're outside the circumcircle, skip this triangle. */
          dy = vertices[c][1] - open[j].y
          if (dx * dx + dy * dy - open[j].r > EPSILON) { continue }

          /* Remove the triangle and add it's edges to the edge list. */
          edges.push(
            open[j].i, open[j].j,
            open[j].j, open[j].k,
            open[j].k, open[j].i
          )
          open.splice(j, 1)
        }

        /* Remove any doubled edges. */
        dedup(edges)

        /* Add a new triangle for each edge. */
        for (j = edges.length; j;) {
          b = edges[--j]
          a = edges[--j]
          open.push(circumcircle(vertices, a, b, c))
        }
      }

      /* Copy any remaining open triangles to the closed list, and then
       * remove any triangles that share a vertex with the supertriangle,
       * building a list of triplets that represent triangles. */
      for (i = open.length; i--;) { closed.push(open[i]) }
      open.length = 0

      for (i = closed.length; i--;) {
        if (closed[i].i < n && closed[i].j < n && closed[i].k < n) { open.push(closed[i].i, closed[i].j, closed[i].k) }
      }

      /* Yay, we're done! */
      return open
    },
    contains: function (tri, p) {
      /* Bounding box test first, for quick rejections. */
      if ((p[0] < tri[0][0] && p[0] < tri[1][0] && p[0] < tri[2][0]) ||
         (p[0] > tri[0][0] && p[0] > tri[1][0] && p[0] > tri[2][0]) ||
         (p[1] < tri[0][1] && p[1] < tri[1][1] && p[1] < tri[2][1]) ||
         (p[1] > tri[0][1] && p[1] > tri[1][1] && p[1] > tri[2][1])) { return null }

      var a = tri[1][0] - tri[0][0],
        b = tri[2][0] - tri[0][0],
        c = tri[1][1] - tri[0][1],
        d = tri[2][1] - tri[0][1],
        i = a * d - b * c

      /* Degenerate tri. */
      if (i === 0.0) { return null }

      var u = (d * (p[0] - tri[0][0]) - b * (p[1] - tri[0][1])) / i,
        v = (a * (p[1] - tri[0][1]) - c * (p[0] - tri[0][0])) / i

      /* If we're outside the tri, fail. */
      if (u < 0.0 || v < 0.0 || (u + v) > 1.0) { return null }

      return [u, v]
    }
  }

  if (typeof module !== 'undefined') { module.exports = Delaunay }
})();

/**
 * StyleFix 1.0.3 & PrefixFree 1.0.7
 * @author Lea Verou
 * MIT license
*/(function () { function t (e, t) { return [].slice.call((t || document).querySelectorAll(e)) } if (!window.addEventListener) return; var e = window.StyleFix = {link: function (t) { try { if (t.rel !== 'stylesheet' || t.hasAttribute('data-noprefix')) return } catch (n) { return } var r = t.href || t.getAttribute('data-href'), i = r.replace(/[^\/]+$/, ''), s = (/^[a-z]{3,10}:/.exec(i) || [''])[0], o = (/^[a-z]{3,10}:\/\/[^\/]+/.exec(i) || [''])[0], u = /^([^?]*)\??/.exec(r)[1], a = t.parentNode, f = new XMLHttpRequest(), l; f.onreadystatechange = function () { f.readyState === 4 && l() }; l = function () { var n = f.responseText; if (n && t.parentNode && (!f.status || f.status < 400 || f.status > 600)) { n = e.fix(n, !0, t); if (i) { n = n.replace(/url\(\s*?((?:"|')?)(.+?)\1\s*?\)/gi, function (e, t, n) { return /^([a-z]{3,10}:|#)/i.test(n) ? e : /^\/\//.test(n) ? 'url("' + s + n + '")' : /^\//.test(n) ? 'url("' + o + n + '")' : /^\?/.test(n) ? 'url("' + u + n + '")' : 'url("' + i + n + '")' }); var r = i.replace(/([\\\^\$*+[\]?{}.=!:(|)])/g, '\\$1'); n = n.replace(RegExp("\\b(behavior:\\s*?url\\('?\"?)" + r, 'gi'), '$1') } var l = document.createElement('style'); l.textContent = n; l.media = t.media; l.disabled = t.disabled; l.setAttribute('data-href', t.getAttribute('href')); a.insertBefore(l, t); a.removeChild(t); l.media = t.media } }; try { f.open('GET', r); f.send(null) } catch (n) { if (typeof XDomainRequest !== 'undefined') { f = new XDomainRequest(); f.onerror = f.onprogress = function () {}; f.onload = l; f.open('GET', r); f.send(null) } }t.setAttribute('data-inprogress', '') }, styleElement: function (t) { if (t.hasAttribute('data-noprefix')) return; var n = t.disabled; t.textContent = e.fix(t.textContent, !0, t); t.disabled = n }, styleAttribute: function (t) { var n = t.getAttribute('style'); n = e.fix(n, !1, t); t.setAttribute('style', n) }, process: function () { t('link[rel="stylesheet"]:not([data-inprogress])').forEach(StyleFix.link); t('style').forEach(StyleFix.styleElement); t('[style]').forEach(StyleFix.styleAttribute) }, register: function (t, n) { (e.fixers = e.fixers || []).splice(n === undefined ? e.fixers.length : n, 0, t) }, fix: function (t, n, r) { for (var i = 0; i < e.fixers.length; i++)t = e.fixers[i](t, n, r) || t; return t }, camelCase: function (e) { return e.replace(/-([a-z])/g, function (e, t) { return t.toUpperCase() }).replace('-', '') }, deCamelCase: function (e) { return e.replace(/[A-Z]/g, function (e) { return '-' + e.toLowerCase() }) }}; (function () { setTimeout(function () { t('link[rel="stylesheet"]').forEach(StyleFix.link) }, 10); document.addEventListener('DOMContentLoaded', StyleFix.process, !1) })() })(); (function (e) { function t (e, t, r, i, s) { e = n[e]; if (e.length) { var o = RegExp(t + '(' + e.join('|') + ')' + r, 'gi'); s = s.replace(o, i) } return s } if (!window.StyleFix || !window.getComputedStyle) return; var n = window.PrefixFree = {prefixCSS: function (e, r, i) { var s = n.prefix; n.functions.indexOf('linear-gradient') > -1 && (e = e.replace(/(\s|:|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/ig, function (e, t, n, r) { return t + (n || '') + 'linear-gradient(' + (90 - r) + 'deg' })); e = t('functions', '(\\s|:|,)', '\\s*\\(', '$1' + s + '$2(', e); e = t('keywords', '(\\s|:)', '(\\s|;|\\}|$)', '$1' + s + '$2$3', e); e = t('properties', '(^|\\{|\\s|;)', '\\s*:', '$1' + s + '$2:', e); if (n.properties.length) { var o = RegExp('\\b(' + n.properties.join('|') + ')(?!:)', 'gi'); e = t('valueProperties', '\\b', ':(.+?);', function (e) { return e.replace(o, s + '$1') }, e) } if (r) { e = t('selectors', '', '\\b', n.prefixSelector, e); e = t('atrules', '@', '\\b', '@' + s + '$1', e) }e = e.replace(RegExp('-' + s, 'g'), '-'); e = e.replace(/-\*-(?=[a-z]+)/gi, n.prefix); return e }, property: function (e) { return (n.properties.indexOf(e) ? n.prefix : '') + e }, value: function (e, r) { e = t('functions', '(^|\\s|,)', '\\s*\\(', '$1' + n.prefix + '$2(', e); e = t('keywords', '(^|\\s)', '(\\s|$)', '$1' + n.prefix + '$2$3', e); return e }, prefixSelector: function (e) { return e.replace(/^:{1,2}/, function (e) { return e + n.prefix }) }, prefixProperty: function (e, t) { var r = n.prefix + e; return t ? StyleFix.camelCase(r) : r }}; (function () { var e = {}, t = [], r = {}, i = getComputedStyle(document.documentElement, null), s = document.createElement('div').style, o = function (n) { if (n.charAt(0) === '-') { t.push(n); var r = n.split('-'), i = r[1]; e[i] = ++e[i] || 1; while (r.length > 3) { r.pop(); var s = r.join('-'); u(s) && t.indexOf(s) === -1 && t.push(s) } } }, u = function (e) { return StyleFix.camelCase(e) in s }; if (i.length > 0) for (var a = 0; a < i.length; a++)o(i[a]); else for (var f in i)o(StyleFix.deCamelCase(f)); var l = {uses: 0}; for (var c in e) { var h = e[c]; l.uses < h && (l = {prefix: c, uses: h}) }n.prefix = '-' + l.prefix + '-'; n.Prefix = StyleFix.camelCase(n.prefix); n.properties = []; for (var a = 0; a < t.length; a++) { var f = t[a]; if (f.indexOf(n.prefix) === 0) { var p = f.slice(n.prefix.length); u(p) || n.properties.push(p) } }n.Prefix == 'Ms' && !('transform' in s) && !('MsTransform' in s) && 'msTransform' in s && n.properties.push('transform', 'transform-origin'); n.properties.sort() })(); (function () { function i (e, t) { r[t] = ''; r[t] = e; return !!r[t] } var e = {'linear-gradient': {property: 'backgroundImage', params: 'red, teal'}, calc: {property: 'width', params: '1px + 5%'}, element: {property: 'backgroundImage', params: '#foo'}, 'cross-fade': {property: 'backgroundImage', params: 'url(a.png), url(b.png), 50%'}}; e['repeating-linear-gradient'] = e['repeating-radial-gradient'] = e['radial-gradient'] = e['linear-gradient']; var t = {initial: 'color', 'zoom-in': 'cursor', 'zoom-out': 'cursor', box: 'display', flexbox: 'display', 'inline-flexbox': 'display', flex: 'display', 'inline-flex': 'display', grid: 'display', 'inline-grid': 'display', 'min-content': 'width'}; n.functions = []; n.keywords = []; var r = document.createElement('div').style; for (var s in e) { var o = e[s], u = o.property, a = s + '(' + o.params + ')'; !i(a, u) && i(n.prefix + a, u) && n.functions.push(s) } for (var f in t) { var u = t[f]; !i(f, u) && i(n.prefix + f, u) && n.keywords.push(f) } })(); (function () { function s (e) { i.textContent = e + '{}'; return !!i.sheet.cssRules.length } var t = {':read-only': null, ':read-write': null, ':any-link': null, '::selection': null}, r = {keyframes: 'name', viewport: null, document: 'regexp(".")'}; n.selectors = []; n.atrules = []; var i = e.appendChild(document.createElement('style')); for (var o in t) { var u = o + (t[o] ? '(' + t[o] + ')' : ''); !s(u) && s(n.prefixSelector(u)) && n.selectors.push(o) } for (var a in r) { var u = a + ' ' + (r[a] || ''); !s('@' + u) && s('@' + n.prefix + u) && n.atrules.push(a) }e.removeChild(i) })(); n.valueProperties = ['transition', 'transition-property']; e.className += ' ' + n.prefix; StyleFix.register(n.prefixCSS) })(document.documentElement)
