(function () {
  var TITLES = {
    'Send us a message': 'en',
    'Saada meile sõnum': 'et',
    'Отправьте нам сообщение': 'ru',
  };

  function sendHeight(iframe) {
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'apply-height') {
        iframe.style.height = e.data.height + 'px';
      }
    });
  }

  function iframeSrc(lang) {
    return '/apply.html?v=4&embed=1&lang=' + lang;
  }

  function makeIframe(lang) {
    var iframe = document.createElement('iframe');
    iframe.src = iframeSrc(lang);
    iframe.style.cssText = 'width:100%;border:none;min-height:680px;display:block;transition:height 0.2s;';
    iframe.setAttribute('scrolling', 'no');
    sendHeight(iframe);
    return iframe;
  }

  function findFormCard() {
    var headings = document.querySelectorAll('h1,h2,h3,h4,p,span');
    for (var i = 0; i < headings.length; i++) {
      var text = headings[i].textContent.trim();
      if (TITLES[text] !== undefined) {
        var lang = TITLES[text];
        var card = headings[i].parentElement;
        for (var j = 0; j < 8; j++) {
          if (!card || card === document.body) break;
          if (card.children.length >= 2) break;
          card = card.parentElement;
        }
        if (card && card !== document.body) return { card: card, lang: lang };
      }
    }
    return null;
  }

  function replaceForm() {
    var found = findFormCard();
    if (!found) return;

    // Always hide — handles React recreating the card on language switch
    found.card.style.display = 'none';

    var existingIframe = document.querySelector('iframe[src*="apply.html"]');

    if (existingIframe) {
      if (existingIframe.src.indexOf('lang=' + found.lang) === -1) {
        existingIframe.src = iframeSrc(found.lang);
      }
      return;
    }

    found.card.insertAdjacentElement('afterend', makeIframe(found.lang));
  }

  // Intercept language button clicks — send postMessage to iframe (no reload)
  document.addEventListener('click', function (e) {
    var el = e.target;
    for (var i = 0; i < 4; i++) {
      if (!el || el === document.body) break;
      var t = el.textContent.trim();
      if (t === 'EN' || t === 'ET' || t === 'RU') {
        var lang = t.toLowerCase();
        setTimeout(function () {
          var iframe = document.querySelector('iframe[src*="apply.html"]');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'set-lang', lang: lang }, '*');
          }
        }, 50);
        break;
      }
      el = el.parentElement;
    }
  });

  var obs = new MutationObserver(replaceForm);
  obs.observe(document.body, { childList: true, subtree: true });
  replaceForm();
})();
