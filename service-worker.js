// ===================================================================
// SERVICE WORKER - Rádio Caeté
// Um Service Worker (SW) é um script que roda em segundo plano
// no navegador, independente da página. Ele é obrigatório para
// que o PWA (Progressive Web App) possa ser instalado no celular
// ou desktop sem precisar de loja de aplicativos.
// ===================================================================

const CACHE_NOME = 'radio-caete-v1';

// Arquivos que serão salvos localmente para carregamento rápido
// (cache = armazenamento local temporário)
const ARQUIVOS_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png'
];

// ===== EVENTO INSTALL: roda quando o SW é instalado pela 1ª vez =====
self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE_NOME)
      .then(cache => {
        console.log('✅ Cache aberto - Rádio Caeté');
        return cache.addAll(ARQUIVOS_CACHE);
      })
      .catch(err => console.warn('Erro ao criar cache:', err))
  );
  // Força o novo SW a ativar imediatamente sem esperar
  self.skipWaiting();
});

// ===== EVENTO ACTIVATE: limpa caches antigos quando há atualização =====
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys().then(nomes => {
      return Promise.all(
        nomes
          .filter(nome => nome !== CACHE_NOME)
          .map(nome => {
            console.log('🗑️ Cache antigo removido:', nome);
            return caches.delete(nome);
          })
      );
    })
  );
  // Assume controle de todas as abas imediatamente
  self.clients.claim();
});

// ===== EVENTO FETCH: intercepta requisições de rede =====
// Estratégia: tenta rede primeiro; se falhar, usa cache local
// (ideal para rádio, pois o stream de áudio sempre vem da internet)
self.addEventListener('fetch', evento => {
  // Ignora o stream de áudio — ele nunca deve ser cacheado
  if (evento.request.url.includes('voxhd.com.br')) {
    return;
  }

  evento.respondWith(
    fetch(evento.request)
      .then(resposta => {
        // Se a rede funcionou, salva uma cópia no cache e retorna
        const copia = resposta.clone();
        caches.open(CACHE_NOME).then(cache => cache.put(evento.request, copia));
        return resposta;
      })
      .catch(() => {
        // Se a rede falhou, tenta servir do cache local
        return caches.match(evento.request);
      })
  );
});
