function applyLang(lang) {
    const t = i18n[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key] !== undefined) el.innerHTML = t[key];
    });
}

function setLang(lang) {
    document.documentElement.lang = lang;
    document.getElementById('btn-uk').classList.toggle('active', lang === 'uk');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    localStorage.setItem('lang', lang);
    applyLang(lang);
    renderCampaign();
    renderBanks();
}

document.addEventListener('DOMContentLoaded', function () {
    const saved = localStorage.getItem('lang') || 'uk';
    setLang(saved);
    renderCampaign();
    renderBanks();
    loadProgress();
});

function deepLink(e, appUrl, webUrl) {
    e.preventDefault();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(webUrl, '_blank', 'noopener');
    }, 800);
}

function copyText(btn, text) {
    if (!text) return;

    const done = () => {
        const span = btn.querySelector('[data-i18n]');
        const origKey = span.getAttribute('data-i18n');
        span.setAttribute('data-i18n', 'system.copied');
        span.textContent = i18n[localStorage.getItem('lang') || 'uk']['system.copied'];
        btn.classList.add('copied');
        setTimeout(() => {
            span.setAttribute('data-i18n', origKey);
            span.textContent = i18n[localStorage.getItem('lang') || 'uk'][origKey];
            btn.classList.remove('copied');
        }, 2000);
    };

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
    }
}

function renderCampaign() {
    const lang = localStorage.getItem('lang') || 'uk';
    const card = document.querySelector('.campaign-card');
    if (!card) return;

    document.getElementById('campaign-image').src = CAMPAIGN.image;
    document.getElementById('campaign-title').textContent = CAMPAIGN.title[lang];
    document.getElementById('campaign-desc').textContent = CAMPAIGN.description[lang];
    document.getElementById('campaign-opened').textContent = CAMPAIGN.date;
    document.getElementById('campaign-goal').textContent = CAMPAIGN.goal + ' UAH';
}

function renderBanks() {
    const lang = localStorage.getItem('lang') || 'uk';
    const localGrid = document.getElementById('local-payment');
    if (!localGrid) return;

    const renderCard = bank => `
    <div class="pay-card">
      <div class="pay-header">
        <img class="pay-logo" src="${bank.logo}" alt="${bank.name}" />
        <div class="pay-name">${bank.name}</div>
      </div>
      ${bank.fields.map(field => `
        <div class="pay-detail">
          <span class="pay-detail-label">${field.label[lang]}</span>
          ${field.type === 'copy'
      ? `<span class="pay-detail-value">${field.value}</span>`
      : `<span class="pay-detail-value"></span>`
    }
          ${field.type === 'link'
      ? `<button class="copy-btn" onclick="deepLink(event, '${field.appUrl}', 'https://${field.value}')"><span data-i18n="system.donate"></span></button>`
      : `<button class="copy-btn" onclick="copyText(this, '${field.value}')"><span data-i18n="system.copy"></span></button>`
    }
        </div>
      `).join('')}
    </div>
  `;

    const enabled = Data.filter(bank => bank.enable);
    localGrid.innerHTML = enabled.filter(b => !b.international).map(renderCard).join('');

    applyLang(lang);
}

function formatMoney(n) {
    return n.toLocaleString('uk-UA') + ' ₴';
}

function loadProgress() {
    fetch('data/collected.json?_=' + Date.now())
      .then(r => r.json())
      .then(data => renderProgress(data.collected))
      .catch(() => {
          const overlay = document.getElementById('progress-overlay');
          if (overlay) overlay.style.display = 'none';
      });
}

function renderProgress(collected) {
    const goalRaw = CAMPAIGN.goal.replace(/\s/g, '');
    const goal = parseInt(goalRaw, 10);
    if (!goal || isNaN(collected)) return;

    const pct = Math.min(100, Math.round((collected / goal) * 100));
    const left = Math.max(0, goal - collected);

    document.getElementById('progress-collected').textContent = formatMoney(collected);
    document.getElementById('progress-percent').textContent = pct + '%';
    document.getElementById('progress-goal-label').textContent = 'з ' + formatMoney(goal);

    const lang = localStorage.getItem('lang') || 'uk';
    const leftEl = document.getElementById('progress-left');
    if (left > 0) {
        leftEl.textContent = i18n[lang]['system.left'] + ' ' + formatMoney(left);
    } else {
        leftEl.textContent = i18n[lang]['system.done'];
        leftEl.style.color = '#4ade80';
    }

    const fill = document.getElementById('progress-fill');
    fill.style.width = pct + '%';
}
