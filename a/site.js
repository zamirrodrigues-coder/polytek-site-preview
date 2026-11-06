/* Polytek, site novo. Tudo aqui é complemento: os botões de contato são links
   comuns e funcionam com este arquivo desligado. */

/* ---------- menu: marca a página atual ---------- */
(function(){
  var links = document.querySelectorAll('.topo-nav a');
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('href') === location.pathname) {
      links[i].setAttribute('aria-current', 'page');
      /* no celular o menu rola de lado: deixa o item da página à vista */
      var faixa = links[i].parentNode;
      faixa.scrollLeft = Math.max(0, links[i].offsetLeft - faixa.offsetLeft - 20);
    }
  }
})();

/* ---------- rastreamento de contatos (Google Ads) ----------
   Mesmo comportamento das páginas antigas: clique em WhatsApp, telefone ou e-mail
   envia um evento nomeado e, quando há rótulo, a conversão. Os rótulos vêm de
   window.POLYTEK, definido no topo da página a partir de src/site.json. */
(function(){
  if (typeof gtag !== 'function') return;
  var rotulos = window.POLYTEK || {};

  function registrar(tipo, destino){
    gtag('event', 'contato_' + tipo, { metodo: tipo, pagina: location.pathname, destino: destino || '' });
    if (rotulos[tipo]) gtag('event', 'conversion', { send_to: rotulos[tipo] });
  }

  document.addEventListener('click', function(ev){
    var a = ev.target.closest ? ev.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('api.whatsapp.com') !== -1 || href.indexOf('wa.me') !== -1) registrar('whatsapp', href);
    else if (href.indexOf('tel:') === 0) registrar('telefone', href);
    else if (href.indexOf('mailto:') === 0) registrar('email', href);
  }, true);
})();

/* ---------- aviso de cookies (LGPD) ----------
   Enquanto a pessoa não decide, o consentimento está negado (definido no topo da página).
   Aceitar libera publicidade e medição. Recusar mantém tudo negado.
   A escolha fica em localStorage e vale para o site inteiro, páginas antigas incluídas. */
(function(){
  var CHAVE = 'polytek_consentimento';
  var ler = function(){ try { return localStorage.getItem(CHAVE); } catch(e){ return null; } };
  var gravar = function(v){ try { localStorage.setItem(CHAVE, v); } catch(e){} };

  function aplicar(v){
    if (typeof gtag !== 'function') return;
    var ok = (v === 'aceito') ? 'granted' : 'denied';
    gtag('consent', 'update', { ad_storage: ok, ad_user_data: ok, ad_personalization: ok, analytics_storage: ok });
  }

  function mostrar(){
    if (document.querySelector('.aviso-cookies')) return;
    var el = document.createElement('div');
    el.className = 'aviso-cookies';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Aviso sobre Cookies');
    el.innerHTML =
      '<p><strong>Este site usa cookies.</strong> Usamos cookies de publicidade para medir quantas pessoas ' +
      'chegam até nós pelos anúncios. Você pode recusar sem perder nenhuma função do site. ' +
      '<a href="https://www.polytek.com.br/politica-de-privacidade/">Política de Privacidade</a></p>' +
      '<div><button type="button" data-recusar>Recusar</button>' +
      '<button type="button" data-aceitar>Aceitar</button></div>';
    document.body.appendChild(el);
    el.addEventListener('click', function(ev){
      var b = ev.target.closest('button');
      if (!b) return;
      var v = b.hasAttribute('data-aceitar') ? 'aceito' : 'recusado';
      gravar(v); aplicar(v);
      if (v === 'aceito') guardarOrigem();
      el.parentNode.removeChild(el);
    });
  }

  /* Origem do anúncio (utm e gclid), guardada só depois do aceite e só nesta aba.
     Nada é enviado: fica pronta para a fase que liga o contato ao CRM. */
  function guardarOrigem(){
    try {
      var p = new URLSearchParams(location.search), o = {}, tem = false;
      ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid'].forEach(function(k){
        if (p.get(k)) { o[k] = p.get(k); tem = true; }
      });
      if (tem && !sessionStorage.getItem('polytek_origem')) sessionStorage.setItem('polytek_origem', JSON.stringify(o));
    } catch(e){}
  }

  var escolha = ler();
  if (escolha === 'aceito') guardarOrigem();
  if (!escolha) mostrar();

  var reabrir = document.querySelector('[data-cookies]');
  if (reabrir) reabrir.addEventListener('click', mostrar);
})();
