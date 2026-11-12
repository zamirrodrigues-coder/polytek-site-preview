/* Polytek, site novo. Tudo aqui é complemento: os botões de contato são links
   comuns e funcionam com este arquivo desligado. */

/* ---------- cabeçalho fixo: altura reservada na rolagem do foco ----------
   O estilo já traz uma altura padrão (--topo-altura). Aqui ela vira a altura medida,
   que muda com a largura da tela e com o tamanho da letra da pessoa. */
(function(){
  var topo = document.querySelector('.topo');
  if (!topo) return;
  var medir = function(){ document.documentElement.style.setProperty('--topo-altura', topo.offsetHeight + 'px'); };
  medir();
  if (window.ResizeObserver) new ResizeObserver(medir).observe(topo);
  else window.addEventListener('resize', medir);
})();

/* ---------- menu: marca a página atual ---------- */
(function(){
  var faixa = document.querySelector('.topo-nav-linha');
  if (!faixa) return;
  var FOLGA = 48;   /* maior que o esmaecido das bordas (44px no estilo) */

  /* No celular o menu rola de lado. Rola só o que falta para o item aparecer inteiro:
     o item da página atual e o item que recebe o foco do teclado. */
  function trazer(a){
    var r = a.getBoundingClientRect(), f = faixa.getBoundingClientRect();
    if (r.left < f.left + FOLGA) faixa.scrollLeft -= f.left + FOLGA - r.left;
    else if (r.right > f.right - FOLGA) faixa.scrollLeft += r.right - (f.right - FOLGA);
  }
  /* Sinal de que há mais itens ao lado: a borda esmaece enquanto houver o que rolar. */
  function sinalizar(){
    faixa.classList.toggle('mais-esquerda', faixa.scrollLeft > 2);
    faixa.classList.toggle('mais-direita', faixa.scrollLeft + faixa.clientWidth < faixa.scrollWidth - 2);
  }

  var links = faixa.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('href') === location.pathname) {
      links[i].setAttribute('aria-current', 'page');
      trazer(links[i]);
    }
  }
  faixa.addEventListener('focusin', function(ev){ if (ev.target.tagName === 'A') trazer(ev.target); });
  faixa.addEventListener('scroll', sinalizar);
  window.addEventListener('resize', sinalizar);
  sinalizar();
})();

/* ---------- eventos de contato ----------
   Clique em WhatsApp, telefone, e-mail ou no link de mapa avisa o Tag Manager, com a página de
   origem. Quem dispara a conversão do Google Ads e o evento do Analytics é a configuração do
   Tag Manager (docs/medicao/gtm-container.json). Sem o Tag Manager carregado, o aviso fica na
   fila e nada é enviado. */
(function(){
  window.dataLayer = window.dataLayer || [];

  function registrar(tipo, destino){
    window.dataLayer.push({ event: 'contato_' + tipo, contato_metodo: tipo, pagina_origem: location.pathname, link_destino: destino || '' });
  }

  document.addEventListener('click', function(ev){
    var a = ev.target.closest ? ev.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('api.whatsapp.com') !== -1 || href.indexOf('wa.me') !== -1) registrar('whatsapp', href);
    else if (href.indexOf('tel:') === 0) registrar('telefone', href);
    else if (href.indexOf('mailto:') === 0) registrar('email', href);
    else if (href.indexOf('google.com/maps') !== -1) registrar('rota', href);
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

  /* A página reserva a altura do aviso enquanto ele está aberto (--aviso-altura, usada
     no estilo): o foco do teclado não rola para trás dele, e o fim da página e o botão
     flutuante continuam à vista. */
  var raiz = document.documentElement;
  var reabrir = document.querySelector('[data-cookies]');
  function reservar(el){
    if (el) raiz.style.setProperty('--aviso-altura', el.offsetHeight + 'px');
    else raiz.style.removeProperty('--aviso-altura');
  }

  /* porPedido: a pessoa abriu pelo rodapé. O foco vai ao aviso e volta ao botão ao fechar. */
  function mostrar(porPedido){
    var aberto = document.querySelector('.aviso-cookies');
    if (aberto) { if (porPedido) aberto.focus(); return; }
    var el = document.createElement('div');
    el.className = 'aviso-cookies';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Aviso sobre Cookies');
    el.tabIndex = -1;
    el.innerHTML =
      '<p><strong>Este site usa cookies.</strong> Usamos cookies do Google para medir as visitas ao site e quantas ' +
      'pessoas chegam até nós pelos anúncios. Você pode recusar sem perder nenhuma função do site. ' +
      '<a href="/polytek-site-preview/pagina-inicial/politica-de-privacidade/">Política de Privacidade</a></p>' +
      '<div><button type="button" data-recusar>Recusar</button>' +
      '<button type="button" data-aceitar>Aceitar</button></div>';
    /* No começo da página: Recusar e Aceitar ficam entre as primeiras paradas do teclado.
       Na tela ele continua embaixo, fixo. */
    document.body.insertBefore(el, document.body.firstChild);
    var medir = function(){ reservar(el); };
    medir();
    var olho = window.ResizeObserver ? new ResizeObserver(medir) : null;
    if (olho) olho.observe(el); else window.addEventListener('resize', medir);
    if (porPedido) el.focus();
    el.addEventListener('click', function(ev){
      var b = ev.target.closest('button');
      if (!b) return;
      var v = b.hasAttribute('data-aceitar') ? 'aceito' : 'recusado';
      gravar(v); aplicar(v);
      if (v === 'aceito') guardarOrigem();
      if (olho) olho.disconnect(); else window.removeEventListener('resize', medir);
      el.parentNode.removeChild(el);
      reservar(null);
      if (porPedido && reabrir) reabrir.focus();
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
  if (!escolha) mostrar(false);

  if (reabrir) reabrir.addEventListener('click', function(){ mostrar(true); });
})();
