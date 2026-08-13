/**
 * waitlist.js — bekleme listesi ve iletişim formları.
 *
 * Site statik; kayıtları tutacak bir sunucu yok. Formlar bu yüzden FormSubmit
 * üzerinden doğrudan e-posta olarak gönderiliyor. Servise ulaşılamazsa mesaj
 * kaybolmasın diye kullanıcının kendi e-posta uygulamasına düşüyoruz.
 *
 * Not: FormSubmit'in ilk gönderimi adrese bir onay maili yollar; o linke bir kez
 * tıklandıktan sonra mesajlar doğrudan gelmeye başlar.
 */
(function(){
  "use strict";

  var U = ['tdogan181', 'gmail.com'];
  var addr = U[0] + '@' + U[1];
  var ENDPOINT = 'https://formsubmit.co/ajax/' + addr;
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function show(el, text, isErr, extra){
    if (window.IvaLang) window.IvaLang.put(el, text, extra);
    else el.textContent = text + (extra || '');
    el.className = 'msg on' + (isErr ? ' err' : '');
  }

  function post(fields){
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(fields)
    }).then(function(r){
      return r.json()['catch'](function(){ return {}; }).then(function(j){
        if (!r.ok || String(j.success) === 'false'){
          throw new Error(j.message || ('HTTP ' + r.status));
        }
        return j;
      });
    });
  }

  function wire(o){
    var form = document.getElementById(o.form);
    if (!form) return;
    var mail = document.getElementById(o.mail);
    var note = document.getElementById(o.note);
    var msg = document.getElementById(o.msg);
    var btn = form.querySelector('button[type=submit]');

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var v = (mail.value || '').trim();
      var d = note ? (note.value || '').trim() : '';
      if (!RE.test(v)){
        show(msg, 'Geçerli bir e-posta adresi yazar mısın?', true);
        mail.focus();
        return;
      }
      if (o.needNote && !d){
        show(msg, 'Bir de mesajını yazar mısın?', true);
        note.focus();
        return;
      }

      btn.disabled = true;
      show(msg, 'Gönderiliyor…');
      post({
        email: v,
        message: d || o.blank,
        _subject: o.subject,
        _template: 'table',
        _captcha: 'false'
      }).then(function(){
        form.reset();
        form.removeAttribute('data-detail');
        show(msg, o.done);
      })['catch'](function(){
        show(msg, 'Gönderemedim — e-posta uygulamanı açıyorum, mesaj hazır, göndermen ' +
                  'yeterli. Açılmazsa şu adrese yazabilirsin:', true, ' ' + addr);
        window.location.href = 'mailto:' + addr +
          '?subject=' + encodeURIComponent(o.subject) +
          '&body=' + encodeURIComponent(o.body(v, d));
      }).then(function(){ btn.disabled = false; });
    });
  }

  wire({
    form: 'wlForm', mail: 'wlMail', note: 'wlNote', msg: 'wlMsg',
    subject: 'İva — bekleme listesi',
    blank: 'Bekleme listesine katılmak istiyorum.',
    done: 'İva hazır olduğunda ilk sen haberdar olacaksın.',
    body: function(v, d){
      return 'Merhaba,\n\nİva hazır olduğunda haberdar olmak istiyorum.\n\n' +
             'E-posta: ' + v + '\n' + (d ? '\n' + d + '\n' : '');
    }
  });

  wire({
    form: 'ctForm', mail: 'ctMail', note: 'ctNote', msg: 'ctMsg', needNote: true,
    subject: 'İva — iletişim',
    blank: '',
    done: 'Mesajın bize ulaştı. En kısa sürede döneceğiz.',
    body: function(v, d){
      return 'Merhaba,\n\n' + d + '\n\nE-posta: ' + v + '\n';
    }
  });

  var more = document.getElementById('wlMore');
  if (more) more.addEventListener('click', function(){
    document.getElementById('wlForm').setAttribute('data-detail', '');
    document.getElementById('wlNote').focus();
  });

  var pilot = document.getElementById('wlPilot');
  if (pilot) pilot.setAttribute('href', 'mailto:' + addr +
    '?subject=' + encodeURIComponent('İva — kurumsal pilot uygulama') +
    '&body=' + encodeURIComponent(
      'Merhaba,\n\nKurumumda İva ile bir pilot uygulama denemek istiyorum.\n\n' +
      'Kurum:\nLokasyon:\nDüşündüğüm senaryo:\n'));
})();
