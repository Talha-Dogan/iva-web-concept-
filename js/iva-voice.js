/**
 * iva-voice.js — İva'nın sesi ve kulağı.
 *
 * İki parça:
 *   • Konuşma  — ekrandaki her balon satırı yüksek sesle de okunuyor
 *     (speechSynthesis). Harflerin akış hızı sesin hızına göre yavaşlatılıyor,
 *     böylece ağız duyduğun sesle örtüşüyor.
 *   • Dinleme  — "İva" diye seslenince uyanıyor, ardından gelen komutu
 *     eşleştiriyor (webkitSpeechRecognition).
 *
 * Burada gerçek bir dil modeli yok; niyet eşleştirmesi var. Statik bir sitede
 * API anahtarı saklanamaz, o yüzden cevaplar sitenin içinde tanımlı. Sunumda
 * internet gitse bile çalışır.
 *
 * Konuşma tanıma yalnızca Chrome/Edge'de var (webkit önekli). Desteklenmeyen
 * tarayıcıda mikrofon düğmesi durumu söyleyip kendini devre dışı bırakıyor.
 */
(function(){
  'use strict';

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var synth = window.speechSynthesis || null;
  var canHear = !!SR;
  var canSpeak = !!synth;

  /** Türkçe'yi eşleştirmeye uygun hale getir: küçült, şapkaları düşür */
  function fold(s){
    return String(s).toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i')
      .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Konuşma tanıma "İva"yı sık sık yanlış duyuyor; hepsini uyandırma sözü sayıyoruz.
  var WAKE = /\b(iva|iwa|iba|hiva|niva|liva|ivan|iva'?ya|eva|ayva)\b/;

  var INTENTS = [
    { id: 'ucbilgi',  words: ['uc bilgi', '3 bilgi', 'bilgi oyunu', 'yanlisi bul', 'yanlis olani'] },
    { id: 'cark',     words: ['cark', 'trivia', 'carki cevir', 'kategori'] },
    { id: 'paratura', words: ['yazi tura', 'para at', 'yazi mi tura', 'tura'] },
    { id: 'zar',      words: ['zar'] },
    { id: 'saka',     words: ['saka', 'espri', 'komik', 'guldur'] },
    { id: 'pomodoro', words: ['odak', 'pomodoro', 'calismaya', 'ders calis', 'sayac'] },
    { id: 'ingilizce',words: ['ingilizce', 'english', 'kelime ogret', 'kelime'] },
    { id: 'merhaba',  words: ['merhaba', 'selam', 'naber', 'nasilsin', 'kimsin'] },
    { id: 'sus',      words: ['sus', 'sesi kapat', 'sessiz'] },
    { id: 'dur',      words: ['dur', 'iptal', 'birak'] }
  ];

  function matchIntent(said){
    for (var i = 0; i < INTENTS.length; i++){
      var w = INTENTS[i].words;
      for (var j = 0; j < w.length; j++){
        if (said.indexOf(w[j]) !== -1) return INTENTS[i].id;
      }
    }
    return null;
  }

  var ANSWERS = {
    merhaba: ['Efendim, buradayım. Ne yapmamı istersin?',
              'Merhaba! Zar atabilirim, çark çevirebilirim, İngilizce çalıştırabilirim.'],
    bilmedim: ['Bunu anlayamadım. Zar at, çark çevir ya da şaka yap diyebilirsin.',
               'Tam duyamadım. Bir daha söyler misin?']
  };
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }

  // İva kadın sesli. Tarayıcı cinsiyet bildirmediği için bilinen isimlerden gidiyoruz:
  // Emel ve Filiz Türkçe kadın sesleri, "Google Türkçe" de kadın duyuluyor.
  var FEMALE = /(emel|filiz|seda|yelda|aylin|zeynep|elif|google\s*t[üu]rk|female|kad[ıi]n)/i;
  var MALE = /(tolga|ahmet|mert|yi[ğg]it|burak|male|erkek)/i;

  function init(stage, screen){
    if (!stage) return;

    var soundBtn = document.getElementById('btnSound');
    var micBtn = document.getElementById('btnMic');
    var hint = document.getElementById('voiceHint');

    var sound = false;                      // tarayıcılar izinsiz ses çalmıyor: kapalı başlıyor
    var listening = false, awakeUntil = 0, missed = 0;
    var rec = null, speakingNow = false, restartTimer = null;
    var voice = null, pitch = 1;

    function say(text){ if (hint) hint.textContent = text; }
    function show(on){
      if (!hint) return;
      if (on) hint.setAttribute('data-on', '');
      else hint.removeAttribute('data-on');
    }
    function flash(text, ms){
      say(text); show(true);
      clearTimeout(flash._t);
      flash._t = setTimeout(function(){ if (!listening) show(false); }, ms || 2600);
    }

    /* ────────────── konuşma ────────────── */

    /**
     * İva kadın sesiyle konuşuyor. Web Speech API cinsiyet bilgisi vermiyor, o
     * yüzden isimden gidiyoruz. Sıra: Türkçe kadın sesi → erkek olmayan Türkçe ses
     * → yalnızca erkek Türkçe ses varsa (Windows'ta çoğu zaman sadece Tolga) onu
     * kullanıp tonu yükseltiyoruz. Belirli bir sesi zorlamak için:
     *   localStorage.setItem('iva-voice', 'Microsoft Emel Online (Natural) - Turkish (Turkey)')
     */
    function pickVoice(){
      if (!canSpeak) return;
      var all = synth.getVoices() || [];
      var forced = null;
      try { forced = localStorage.getItem('iva-voice'); } catch (e) {}
      if (forced){
        for (var f = 0; f < all.length; f++){
          if (all[f].name === forced){ voice = all[f]; pitch = 1; return; }
        }
      }
      var tr = [];
      for (var i = 0; i < all.length; i++) if (/^tr/i.test(all[i].lang)) tr.push(all[i]);

      var byName = function(re){
        for (var k = 0; k < tr.length; k++) if (re.test(tr[k].name)) return tr[k];
        return null;
      };
      var she = byName(FEMALE);
      if (she){ voice = she; pitch = 1; return; }
      var neutral = null;
      for (var m = 0; m < tr.length; m++) if (!MALE.test(tr[m].name)){ neutral = tr[m]; break; }
      if (neutral){ voice = neutral; pitch = 1.05; return; }
      if (tr.length){ voice = tr[0]; pitch = 1.4; return; }   // elimizde bir Tolga var
      voice = null; pitch = 1.25;                              // Türkçe ses hiç yok
    }
    if (canSpeak){
      pickVoice();
      synth.addEventListener ? synth.addEventListener('voiceschanged', pickVoice)
                             : (synth.onvoiceschanged = pickVoice);
    }

    // hangi sesin seçildiğini görmek için: IvaVoice.current()
    window.IvaVoice.current = function(){
      return {
        voice: voice ? voice.name : '(tarayıcı varsayılanı)',
        pitch: pitch, sound: sound, listening: listening,
        turkishVoices: canSpeak
          ? (synth.getVoices() || []).filter(function(v){ return /^tr/i.test(v.lang); })
              .map(function(v){ return v.name; })
          : []
      };
    };

    function speak(text){
      if (!sound || !canSpeak || !text) return;
      try { synth.cancel(); } catch (e) {}
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR';
      if (voice) u.voice = voice;
      u.rate = 1;
      u.pitch = pitch;
      // İva kendi sesini duyup tekrar uyanmasın: konuşurken kulağı kapatıyoruz
      u.onstart = function(){ speakingNow = true; pauseEar(); };
      u.onend = u.onerror = function(){ speakingNow = false; resumeEar(); };
      try { synth.speak(u); } catch (e) {}
    }

    // her balon satırı aynı anda sesli de okunuyor
    stage.onSay(function(text){ speak(text); });

    function setSound(on){
      sound = !!on;
      if (soundBtn){
        soundBtn.setAttribute('aria-pressed', sound ? 'true' : 'false');
        soundBtn.setAttribute('aria-label', sound ? 'Sesi kapat' : 'Sesi aç');
        soundBtn.title = sound ? 'Sesi kapat' : 'Sesi aç';
      }
      // sesliyken harfler daha yavaş dökülsün, ağız duyulan sesle örtüşsün
      stage.pace(sound ? 1.75 : 1);
      if (!sound && canSpeak){ try { synth.cancel(); } catch (e) {} }
      try { localStorage.setItem('iva-sound', sound ? '1' : '0'); } catch (e) {}
    }

    if (soundBtn){
      soundBtn.addEventListener('click', function(){
        setSound(!sound);
        if (sound){
          flash('Ses açık — İva artık yüksek sesle konuşuyor.');
          stage.say('Sesim açıldı. Artık beni duyabilirsin.');
        } else {
          flash('Ses kapatıldı.');
        }
      });
      setSound(false);
    }

    /* ────────────── dinleme ────────────── */

    function pauseEar(){
      if (rec && listening){ try { rec.stop(); } catch (e) {} }
    }
    function resumeEar(){
      if (!listening) return;
      clearTimeout(restartTimer);
      restartTimer = setTimeout(function(){
        if (listening && !speakingNow){ try { rec.start(); } catch (e) {} }
      }, 350);
    }

    function reply(text){
      stage.say(text);                       // balon + ağız; ses açıksa sesli de
    }

    function run(id){
      awakeUntil = Date.now() + 9000;
      missed = 0;
      if (id === 'sus'){ setSound(false); reply('Tamam, susuyorum.'); return; }
      if (id === 'dur'){ stage.stop(); flash('Durdum.'); return; }
      if (id === 'merhaba'){ reply(pick(ANSWERS.merhaba)); return; }
      if (screen && screen.SCENES && screen.SCENES[id]){
        var btn = document.querySelector('#heroActs button[data-scene="' + id + '"]');
        if (btn) btn.click();                // düğmeyle aynı yol: vurgu + kamera + sahne
        else stage.play(id);
        return;
      }
      reply(pick(ANSWERS.bilmedim));
    }

    function heard(raw, isFinal){
      var said = fold(raw);
      if (!said) return;
      if (listening) say('“' + raw.trim() + '”');

      var awake = Date.now() < awakeUntil;
      var wake = WAKE.test(said);
      var intent = matchIntent(said);

      // "İva, zar at" — tek cümlede hem çağrı hem komut
      if (wake && intent){ run(intent); return; }
      if (wake && !awake){
        awakeUntil = Date.now() + 9000;
        missed = 0;
        reply('Efendim, neye ihtiyacın var?');
        return;
      }
      if (awake && intent){ run(intent); return; }
      if (awake && isFinal && said.split(' ').length > 1 && ++missed === 1){
        reply(pick(ANSWERS.bilmedim));
      }
    }

    function build(){
      var r = new SR();
      r.lang = 'tr-TR';
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.onresult = function(e){
        if (speakingNow) return;             // kendi sesini dinlemesin
        for (var i = e.resultIndex; i < e.results.length; i++){
          heard(e.results[i][0].transcript, e.results[i].isFinal);
        }
      };
      r.onerror = function(e){
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed'){
          setListening(false);
          flash('Mikrofon izni verilmedi. Adres çubuğundaki kilitten açabilirsin.', 6000);
        }
      };
      r.onend = function(){
        // Chrome sessizlikte kendi kendine kapanıyor; istiyorsak geri açıyoruz
        if (listening && !speakingNow) resumeEar();
      };
      return r;
    }

    function setListening(on){
      listening = !!on;
      if (micBtn){
        micBtn.setAttribute('aria-pressed', listening ? 'true' : 'false');
        micBtn.setAttribute('aria-label', listening ? 'Mikrofonu kapat' : 'Mikrofonu aç');
        micBtn.title = listening ? 'Mikrofonu kapat' : 'Mikrofonu aç';
      }
      if (listening){
        if (!rec) rec = build();
        try { rec.start(); } catch (e) {}
        show(true);
        say('Dinliyorum — "İva" diye seslen.');
      } else {
        clearTimeout(restartTimer);
        if (rec){ try { rec.abort(); } catch (e) {} }
        awakeUntil = 0;
        flash('Mikrofon kapatıldı.');
      }
    }

    if (micBtn){
      if (!canHear){
        micBtn.disabled = true;
        micBtn.title = 'Bu tarayıcı sesli komutu desteklemiyor — Chrome ya da Edge dene';
        micBtn.setAttribute('aria-label', micBtn.title);
        micBtn.addEventListener('click', function(){
          flash('Sesli komut için Chrome ya da Edge gerekiyor.', 5000);
        });
      } else {
        micBtn.addEventListener('click', function(){
          if (!listening && !sound) setSound(true);   // duymadan konuşmak tuhaf olur
          setListening(!listening);
        });
      }
    }

    // sekme arkaya alınınca mikrofonu ve sesi bırak
    document.addEventListener('visibilitychange', function(){
      if (!document.hidden) return;
      if (canSpeak){ try { synth.cancel(); } catch (e) {} }
      if (listening) setListening(false);
    });

    return { setSound: setSound, setListening: setListening };
  }

  window.IvaVoice = {
    init: init, canHear: canHear, canSpeak: canSpeak,
    fold: fold, WAKE: WAKE,
    /** duyulan bir cümlenin hangi komuta düştüğünü söyler (hata ayıklama için) */
    match: function(text){ return matchIntent(fold(text)); }
  };
})();
