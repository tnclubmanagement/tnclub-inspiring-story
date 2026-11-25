(function() {
  'use strict';

  function normalize(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  }

  document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('beautifuljekyll-search-overlay');
    var trigger = document.getElementById('nav-search-link');
    if (!overlay || !trigger) return;
    var input = document.getElementById('nav-search-input');
    var results = document.getElementById('search-results-container');
    var exit = document.getElementById('nav-search-exit');
    var entries = null;
    var pending = null;

    function message(text) {
      results.replaceChildren();
      if (!text) return;
      var item = document.createElement('li');
      item.textContent = text;
      results.appendChild(item);
    }

    function render() {
      var words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
      if (!words.length) {
        message('');
        return;
      }
      var matches = entries.filter(function(entry) {
        return words.every(function(word) { return entry.query.indexOf(word) !== -1; });
      }).slice(0, 10);
      message(matches.length ? '' : overlay.dataset.empty);
      matches.forEach(function(entry) {
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.href = entry.url;
        link.textContent = entry.title;
        item.appendChild(link);
        results.appendChild(item);
      });
    }

    function load() {
      if (entries) {
        render();
        return Promise.resolve();
      }
      if (pending) return pending;
      message(overlay.dataset.loading);
      overlay.setAttribute('aria-busy', 'true');
      pending = fetch(overlay.dataset.indexUrl, { credentials: 'same-origin' })
        .then(function(response) {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        })
        .then(function(data) {
          if (!Array.isArray(data)) throw new Error('Invalid search index');
          entries = data.filter(function(entry) {
            if (!entry || typeof entry.title !== 'string' || typeof entry.url !== 'string') return false;
            try {
              var url = new URL(entry.url, window.location.href);
              return /^https?:$/.test(url.protocol) && url.origin === window.location.origin;
            } catch (error) { return false; }
          }).map(function(entry) {
            return {
              title: entry.title, url: entry.url,
              query: normalize(entry.title + ' ' + (entry.category || ''))
            };
          });
          render();
        })
        .catch(function() {
          entries = null;
          message(overlay.dataset.error);
        })
        .finally(function() {
          pending = null;
          overlay.removeAttribute('aria-busy');
        });
      return pending;
    }

    trigger.addEventListener('click', load);
    input.addEventListener('focus', load);
    input.addEventListener('input', load);
    exit.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        exit.click();
      }
    });
  });
})();
