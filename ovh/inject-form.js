(function () {
  function sendHeight(iframe) {
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'apply-height') {
        iframe.style.height = e.data.height + 'px';
      }
    });
  }

  function makeIframe() {
    var iframe = document.createElement('iframe');
    iframe.src = '/apply.html?embed=1';
    iframe.style.cssText = 'width:100%;border:none;min-height:680px;display:block;transition:height 0.2s;';
    iframe.setAttribute('scrolling', 'no');
    sendHeight(iframe);
    return iframe;
  }

  function replaceForm() {
    // Find heading containing "Send us a message"
    var headings = document.querySelectorAll('h1,h2,h3,h4,p,span');
    var titleEl = null;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].textContent.trim() === 'Send us a message') {
        titleEl = headings[i];
        break;
      }
    }
    if (!titleEl) return false;

    // Walk up until we find a node with ≥2 block children (the card)
    var card = titleEl.parentElement;
    for (var i = 0; i < 8; i++) {
      if (!card || card === document.body) break;
      if (card.children.length >= 2) break;
      card = card.parentElement;
    }
    if (!card || card === document.body) return false;

    card.replaceWith(makeIframe());
    return true;
  }

  if (!replaceForm()) {
    var obs = new MutationObserver(function () {
      if (replaceForm()) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
})();
