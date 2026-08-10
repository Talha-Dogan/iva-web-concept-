/**
 * iva-screen.js — the device's little OLED screen, brought to life.
 *
 * The GLB models carry an "iva-screen" surface baked onto the front door's
 * recessed pocket by tools/add-screen.mjs; it is the only geometry in them with
 * UVs. This module paints a canvas onto that material's emissive channel, so the
 * panel reads as black glass with a glowing face — or a die, a word card, a timer.
 *
 * A "stage" is one independent screen: its own canvas, its own state, its own
 * script. The hero gets a stage you can play with (drag reactions, buttons, a
 * speech bubble); the exploded-view model gets a separate one that just idles, so
 * a game running up in the hero never leaks into the product section.
 *
 *   var stage = IvaScreen.createStage();
 *   stage.attach(modelViewerElement);   // paint onto the model's screen
 *   stage.preview(canvasElement);       // ...and/or onto a plain page canvas
 *   stage.hold('mutlu');                // pin an expression (null = idle cycle)
 *   stage.bubble(el); stage.say('...'); // speech bubble, typed word by word
 *   stage.play('zar');                  // run a screen scene
 *   stage.gestures(modelViewerElement); // react to being dragged around
 */
(function(){
  'use strict';

  /* ══════════ the panel ══════════ */

  var W = 512, H = 396;                    // 1.293 — the baked screen's aspect
  var CX = W / 2;
  var EYE_Y = Math.round(H * 0.43), EYE_DX = Math.round(W * 0.17);
  var MOUTH_Y = Math.round(H * 0.73);
  var INK = '#e4f7ff', GLOW = 'rgba(96,214,255,.72)';
  var FONT = '"Nunito",system-ui,sans-serif';
  var TICK = 50;                           // 20fps keeps the chunky OLED feel
  var TAU = Math.PI * 2;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MORPH = reduce ? 0 : 420;            // 0 makes every transition instant

  /* ══════════ expressions ══════════
     Every feature is a round-capped stroke along a quadratic curve, so an
     expression is just numbers — which means any two of them can be interpolated.
     halfLen 0 collapses a stroke to its round cap, i.e. a circle of `thick`;
     bulge bends it (positive bends downward); tilt rotates it (degrees).

        0..3   left eye:  half, thick, bulge, tilt
        4..7   right eye: half, thick, bulge, tilt
        8..10  mouth:     half, thick, bulge
       11..12  gaze:      x, y                                                  */
  var FACES = {
    sakin:     [  0,  84,   0,   0,     0,  84,   0,   0,    52,  20,  26,    0,   0],
    mutlu:     [ 44,  24, -32,   0,    44,  24, -32,   0,    70,  24,  46,    0,  -2],
    saskin:    [  0, 104,   0,   0,     0, 104,   0,   0,     4,  52,   0,    0,  -4],
    goz_kirp:  [ 42,  22, -28,   0,    44,  16,   0,   0,    60,  22,  32,    0,  -2],
    dusunen:   [  0,  78,   0,   0,     0,  78,   0,   0,    26,  20,  14,  -26, -14],
    uykulu:    [ 46,  20, -14,   0,    46,  20, -14,   0,    20,  18,  12,    0,  12],
    konusuyor: [  0,  84,   0,   0,     0,  84,   0,   0,    20,  22,   0,    0,   0],
    dinliyor:  [  0,  78,   0,   0,     0,  88,   0,   0,    17,  14,   0,   10,  -2],
    sinirli:   [ 42,  20,  -4,  17,    42,  20,  -4, -17,    46,  20, -26,    0,   4],
    gulme:     [ 46,  22, -34,   0,    46,  22, -34,   0,    40,  56,  30,    0,  -2]
  };
  var BLINK = [46, 12, 0, 0];              // one eye slot at the bottom of a blink
  var PLAY = [
    ['sakin', 2400], ['konusuyor', 3400], ['mutlu', 2000], ['dinliyor', 2600],
    ['saskin', 1500], ['goz_kirp', 1300], ['dusunen', 2500], ['uykulu', 2200]
  ];

  function lerp(a, b, k){ return a + (b - a) * k; }
  function ease(k){ return k < 0.5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3) / 2; }
  function rand(a, b){ return a + Math.random() * (b - a); }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function now(){ return window.performance && performance.now ? performance.now() : Date.now(); }

  function layout(p){
    return [
      [CX - EYE_DX + p[11], EYE_Y + p[12], p[0], p[1], p[2], p[3]],
      [CX + EYE_DX + p[11], EYE_Y + p[12], p[4], p[5], p[6], p[7]],
      [CX + p[11] * 0.4, MOUTH_Y + p[12] * 0.4, p[8], p[9], p[10], 0]
    ];
  }

  function feature(g, cx, cy, half, thick, bulge, tilt){
    if (thick <= 0.5) return;
    g.save();
    g.translate(cx, cy);
    if (tilt) g.rotate(tilt * Math.PI / 180);
    g.lineWidth = thick;
    g.beginPath();
    if (half < 0.8){ g.moveTo(-0.4, 0); g.lineTo(0.4, 0); }
    else { g.moveTo(-half, 0); g.quadraticCurveTo(0, bulge * 2, half, 0); }
    g.stroke();
    g.restore();
  }

  function clear(g){
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.globalAlpha = 1;
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
  }
  function glowOn(g, blur){ g.shadowColor = GLOW; g.shadowBlur = blur || 22; }
  function glowOff(g){ g.shadowColor = 'transparent'; g.shadowBlur = 0; }

  function drawFace(g, p){
    var f = layout(p), i;
    g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++){
      if (pass === 0) glowOn(g, 26); else glowOff(g);
      for (i = 0; i < 3; i++) feature(g, f[i][0], f[i][1], f[i][2], f[i][3], f[i][4], f[i][5]);
    }
  }

  /** the same geometry as an SVG path, so an expression card depicts exactly the
      face the device will show — one table, one shape, two renderers */
  function svg(name){
    var p = FACES[name];
    if (!p) return '';
    var r = function(v){ return Math.round(v * 10) / 10; };
    var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" fill="none" stroke="currentColor" ' +
              'stroke-linecap="round" aria-hidden="true">';
    layout(p).forEach(function(f){
      var d = f[2] < 0.8
        ? 'M' + r(f[0] - 0.4) + ' ' + r(f[1]) + 'h0.8'
        : 'M' + r(f[0] - f[2]) + ' ' + r(f[1]) + 'Q' + r(f[0]) + ' ' + r(f[1] + f[4] * 2) +
          ' ' + r(f[0] + f[2]) + ' ' + r(f[1]);
      var tr = f[5] ? ' transform="rotate(' + r(f[5]) + ' ' + r(f[0]) + ' ' + r(f[1]) + ')"' : '';
      out += '<path d="' + d + '" stroke-width="' + r(f[3]) + '"' + tr + '/>';
    });
    return out + '</svg>';
  }

  /* ══════════ what else the screen can show ══════════ */

  var PIPS = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
  };

  function roundRect(g, x, y, w, h, r){
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /** shrink the font until the text fits the panel */
  function fitText(g, text, weight, size, max){
    do {
      g.font = weight + ' ' + size + 'px ' + FONT;
      if (g.measureText(text).width <= max) break;
      size -= 4;
    } while (size > 16);
    return size;
  }

  function drawDice(g, s, t){
    var side = 170, rolling = !reduce && t < s.until - 260;
    if (rolling && t - s.at > 80){ s.at = t; s.show = 1 + Math.floor(Math.random() * 6); }
    if (!rolling) s.show = s.value;
    g.save();
    g.translate(CX, H * 0.5);
    if (rolling) g.rotate(Math.sin(t / 34) * 0.16);
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 11; g.lineJoin = 'round';
    glowOn(g, 20);
    roundRect(g, -side / 2, -side / 2, side, side, 30);
    g.stroke();
    glowOff(g);
    var d = side * 0.27;
    PIPS[s.show].forEach(function(pip){
      g.beginPath(); g.arc(pip[0] * d, pip[1] * d, 13, 0, TAU); g.fill();
    });
    g.restore();
  }

  function drawWord(g, s){
    g.textAlign = 'center';
    g.fillStyle = INK;
    glowOn(g, 18);
    fitText(g, s.en, '900', 96, W - 70);
    g.fillText(s.en, CX, H * 0.46);
    glowOff(g);
    g.strokeStyle = INK; g.globalAlpha = 0.3; g.lineWidth = 4;
    g.beginPath(); g.moveTo(CX - 64, H * 0.575); g.lineTo(CX + 64, H * 0.575); g.stroke();
    g.globalAlpha = 0.72;
    fitText(g, s.tr, '800', 46, W - 90);
    g.fillText(s.tr, CX, H * 0.75);
    g.globalAlpha = 1;
  }

  function drawTimer(g, s, t){
    var k = reduce ? 1 : clamp((t - s.from) / Math.max(1, s.until - 300 - s.from), 0, 1);
    var R = 118;
    g.save();
    g.translate(CX, H * 0.5);
    g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = 14;
    g.globalAlpha = 0.2;
    g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
    g.globalAlpha = 1;
    glowOn(g, 20);
    g.beginPath(); g.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke();
    glowOff(g);
    g.fillStyle = INK; g.textAlign = 'center';
    g.font = '900 64px ' + FONT;
    g.fillText(s.label, 0, 8);
    g.globalAlpha = 0.6;
    g.font = '800 26px ' + FONT;
    g.fillText(s.note, 0, 48);
    g.globalAlpha = 1;
    g.restore();
  }

  function checkAt(g, x, y, r){
    g.lineWidth = Math.max(5, r * 0.32);
    g.beginPath();
    g.moveTo(x - r * 0.8, y);
    g.lineTo(x - r * 0.15, y + r * 0.62);
    g.lineTo(x + r * 0.85, y - r * 0.72);
    g.stroke();
  }
  function crossAt(g, x, y, r){
    g.lineWidth = Math.max(5, r * 0.32);
    g.beginPath();
    g.moveTo(x - r * 0.7, y - r * 0.7); g.lineTo(x + r * 0.7, y + r * 0.7);
    g.moveTo(x + r * 0.7, y - r * 0.7); g.lineTo(x - r * 0.7, y + r * 0.7);
    g.stroke();
  }
  function trophyAt(g, x, y, r){
    g.lineWidth = Math.max(5, r * 0.22);
    g.beginPath();                                   // cup
    g.moveTo(x - r * 0.55, y - r * 0.8);
    g.lineTo(x + r * 0.55, y - r * 0.8);
    g.lineTo(x + r * 0.4, y + r * 0.1);
    g.lineTo(x - r * 0.4, y + r * 0.1);
    g.closePath(); g.stroke();
    g.beginPath();                                   // handles
    g.arc(x - r * 0.55, y - r * 0.45, r * 0.3, Math.PI * 0.5, Math.PI * 1.5, true);
    g.stroke();
    g.beginPath();
    g.arc(x + r * 0.55, y - r * 0.45, r * 0.3, Math.PI * 1.5, Math.PI * 0.5, true);
    g.stroke();
    g.beginPath();                                   // stem and base
    g.moveTo(x, y + r * 0.1); g.lineTo(x, y + r * 0.5);
    g.moveTo(x - r * 0.45, y + r * 0.6); g.lineTo(x + r * 0.45, y + r * 0.6);
    g.stroke();
  }

  /** v2's trivia_wheel, as a slot machine: the categories rush past, slow down
      and settle on one. Same six categories the firmware ships with. */
  function drawWheel(g, s, t){
    var k = reduce ? 1 : clamp((t - s.from) / Math.max(1, s.until - s.from), 0, 1);
    var e = 1 - Math.pow(1 - k, 3);
    var n = WHEEL.length;
    var pos = e * (3 * n + s.index);                 // three loops, then land
    var base = Math.floor(pos), frac = pos - base;
    var dy = 104, winY = H * 0.5 - 52;

    g.save();
    roundRect(g, 40, winY, W - 80, 104, 22);
    g.clip();
    g.textAlign = 'center';
    g.fillStyle = INK;
    for (var o = -1; o <= 1; o++){
      var mid = Math.abs(o - frac) < 0.5;
      g.globalAlpha = mid ? 1 : 0.26;
      if (mid) glowOn(g, 20); else glowOff(g);
      fitText(g, WHEEL[((base + o) % n + n) % n], '900', mid ? 60 : 46, W - 110);
      g.fillText(WHEEL[((base + o) % n + n) % n], CX, H * 0.5 + (o - frac) * dy + 20);
    }
    g.restore();
    glowOff(g);
    g.globalAlpha = 0.45; g.strokeStyle = INK; g.lineWidth = 5;
    roundRect(g, 40, winY, W - 80, 104, 22); g.stroke();
    g.globalAlpha = 1;
  }

  /** three statements, one of them false */
  function drawFacts(g, s){
    var items = s.set.items;
    g.strokeStyle = INK; g.fillStyle = INK;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (var i = 0; i < 3; i++){
      var y = 82 + i * 116;
      var on = s.active === i;
      g.globalAlpha = (on || s.reveal) ? 1 : 0.45;
      if (on) glowOn(g, 18); else glowOff(g);
      g.lineWidth = 6;
      g.beginPath(); g.arc(62, y, 30, 0, TAU); g.stroke();
      g.textAlign = 'center';
      g.font = '900 34px ' + FONT;
      g.fillText(String(i + 1), 62, y + 12);
      g.textAlign = 'left';
      fitText(g, items[i][0], '800', 38, W - 210);
      g.fillText(items[i][0], 108, y + 13);
      if (s.reveal){
        if (s.set.wrong === i) crossAt(g, W - 48, y, 24);
        else checkAt(g, W - 48, y, 24);
      }
    }
    g.globalAlpha = 1; glowOff(g);
  }

  /** v2's show_banner feedback scenes: correct / wrong / trophy */
  function drawMark(g, s){
    g.strokeStyle = INK; g.fillStyle = INK;
    g.lineCap = 'round'; g.lineJoin = 'round';
    glowOn(g, 26);
    var y = s.label ? H * 0.4 : H * 0.5;
    if (s.mark === 'wrong') crossAt(g, CX, y, 66);
    else if (s.mark === 'trophy') trophyAt(g, CX, y, 66);
    else checkAt(g, CX, y, 66);
    glowOff(g);
    if (s.label){
      g.textAlign = 'center';
      g.globalAlpha = 0.85;
      fitText(g, s.label, '900', 42, W - 80);
      g.fillText(s.label, CX, H * 0.8);
      g.globalAlpha = 1;
    }
  }

  function drawScreen(g, s, t){
    if (s.kind === 'dice') drawDice(g, s, t);
    else if (s.kind === 'word') drawWord(g, s);
    else if (s.kind === 'timer') drawTimer(g, s, t);
    else if (s.kind === 'wheel') drawWheel(g, s, t);
    else if (s.kind === 'facts') drawFacts(g, s);
    else if (s.kind === 'mark') drawMark(g, s);
  }

  /* ══════════ scenes: a little script of steps ══════════
     ['say', text|fn]   speech bubble, typed word by word, mouth in sync
     ['face', name, ms] hold an expression for the rest of the step
     ['dice', ms] ['word', [en,tr], ms] ['timer', ms]   screen content          */

  // the six categories the v2 firmware's trivia wheel ships with
  var WHEEL = ['Bilim', 'Sanat', 'Spor', 'Tarih', 'Coğrafya', 'Eğlence'];

  var TRIVIA = {
    'Bilim':    { q: 'Suyun kimyasal formülü nedir?', a: 'H2O.' },
    'Sanat':    { q: 'Mona Lisa tablosunu kim yaptı?', a: 'Leonardo da Vinci.' },
    'Spor':     { q: 'Bir futbol maçı normal süresiyle kaç dakikadır?', a: '90 dakika, iki devre.' },
    'Tarih':    { q: 'Cumhuriyet hangi yıl ilan edildi?', a: '1923.' },
    'Coğrafya': { q: 'Türkiye\'nin en uzun nehri hangisidir?', a: 'Kızılırmak.' },
    'Eğlence':  { q: 'Satranç tahtasında kaç kare vardır?', a: '64.' }
  };

  // üç bilgi, biri yanlış — [ekranda kısa hâli, sesli hâli]
  var FACTS = {
    'Bilim': [{
      items: [['Güneş bir yıldızdır', 'Güneş bir yıldızdır.'],
              ['Su 100 derecede kaynar', 'Deniz seviyesinde su 100 derecede kaynar.'],
              ['Ay bir gezegendir', 'Ay bir gezegendir.']],
      wrong: 2, why: 'Ay gezegen değil, Dünya\'nın uydusu.'
    }],
    'Sanat': [{
      items: [['Mona Lisa Leonardo\'nun', 'Mona Lisa tablosu Leonardo da Vinci\'nin.'],
              ['Van Gogh Hollandalı', 'Van Gogh Hollandalı bir ressam.'],
              ['Beethoven ressamdı', 'Beethoven bir ressamdı.']],
      wrong: 2, why: 'Beethoven ressam değil, besteciydi.'
    }],
    'Spor': [{
      items: [['Futbolda takım 11 kişi', 'Futbolda bir takım sahada on bir kişidir.'],
              ['Maraton 42 kilometre', 'Maraton yaklaşık kırk iki kilometredir.'],
              ['Olimpiyat her yıl', 'Olimpiyatlar her yıl yapılır.']],
      wrong: 2, why: 'Olimpiyatlar her yıl değil, dört yılda bir yapılır.'
    }],
    'Tarih': [{
      items: [['İstanbul 1453\'te fethedildi', 'İstanbul bin dört yüz elli üçte fethedildi.'],
              ['Cumhuriyet 1923\'te', 'Cumhuriyet bin dokuz yüz yirmi üçte ilan edildi.'],
              ['1. Dünya Savaşı 1945\'te', 'Birinci Dünya Savaşı bin dokuz yüz kırk beşte başladı.']],
      wrong: 2, why: 'Birinci Dünya Savaşı 1914\'te başladı; 1945 İkinci Dünya Savaşı\'nın bitişi.'
    }],
    'Coğrafya': [{
      items: [['En yüksek dağ Ağrı', 'Türkiye\'nin en yüksek dağı Ağrı Dağı.'],
              ['Nil Afrika\'da akar', 'Nil nehri Afrika\'da akar.'],
              ['Ankara kıyı şehri', 'Ankara bir kıyı şehri.']],
      wrong: 2, why: 'Ankara iç kesimde; denize kıyısı yok.'
    }],
    'Eğlence': [{
      items: [['Satranç tahtası 64 kare', 'Satranç tahtasında altmış dört kare var.'],
              ['Rubik küpü 6 yüzlü', 'Rubik küpünün altı yüzü var.'],
              ['İskambil destesi 40 kart', 'Bir iskambil destesinde kırk kart var.']],
      wrong: 2, why: 'Standart destede 40 değil, 52 kart var.'
    }]
  };

  var WORDS = [
    ['apple', 'elma'], ['book', 'kitap'], ['water', 'su'], ['window', 'pencere'],
    ['friend', 'arkadaş'], ['morning', 'sabah'], ['bridge', 'köprü'], ['bread', 'ekmek']
  ];
  var JOKES = [
    ['Bilgisayarım dün üşütmüş.', 'Nedenini sordum: Windows açık kalmış.'],
    ['Matematik kitabı neden üzgünmüş?', 'Çok fazla problemi varmış.'],
    ['Kalem kağıda ne demiş?', '"Sensiz bir çizgi bile değilim."']
  ];
  var wordAt = 0, jokeAt = 0;

  var SCENES = {
    zar: function(){
      return [
        ['face', 'dusunen', 500],
        ['say', 'Zar atıyorum, hazır ol.'],
        ['dice', 1900],
        ['say', function(d){
          return d.dice + ' geldi. ' + (d.dice > 4 ? 'Şansın yerinde!' : 'Bir daha atalım mı?');
        }],
        ['face', function(d){ return d.dice > 4 ? 'mutlu' : 'sakin'; }, 900]
      ];
    },
    ingilizce: function(){
      var a = WORDS[wordAt++ % WORDS.length], b = WORDS[wordAt++ % WORDS.length];
      return [
        ['face', 'dinliyor', 500],
        ['say', 'Bugünün kelimeleri. Hazırsan başlıyoruz.'],
        ['word', a, 1600],
        ['say', '"' + a[0] + '" — ' + a[1] + '. Tekrar et.'],
        ['word', b, 1600],
        ['say', '"' + b[0] + '" — ' + b[1] + '. Güzel, yarın kaldığımız yerden.'],
        ['face', 'mutlu', 900]
      ];
    },
    pomodoro: function(){
      return [
        ['face', 'sakin', 400],
        ['say', '25 dakikalık odak seansı başlıyor.'],
        ['timer', 2600],
        ['say', 'Süre işliyor. Molan gelince haber vereceğim.'],
        ['face', 'dinliyor', 900]
      ];
    },
    saka: function(){
      var j = JOKES[jokeAt++ % JOKES.length];
      return [
        ['face', 'dusunen', 700],
        ['say', j[0]],
        ['say', j[1]],
        ['face', 'gulme', 1700]
      ];
    },
    cark: function(){
      var i = Math.floor(Math.random() * WHEEL.length);
      var cat = WHEEL[i], t = TRIVIA[cat];
      return [
        ['face', 'dinliyor', 400],
        ['say', 'Çarkı çeviriyorum.'],
        ['wheel', i, 2600],
        ['say', 'Kategori ' + cat + '. Sorum geliyor.'],
        ['say', t.q],
        ['face', 'dusunen', 2000],
        ['say', 'Cevap: ' + t.a],
        ['mark', 'trophy', cat, 1600]
      ];
    },
    ucbilgi: function(){
      var i = Math.floor(Math.random() * WHEEL.length);
      var cat = WHEEL[i];
      var pool = FACTS[cat];
      var set = pool[Math.floor(Math.random() * pool.length)];
      return [
        ['face', 'dinliyor', 400],
        ['say', 'Çarkı çeviriyorum.'],
        ['wheel', i, 2400],
        ['say', 'Kategori ' + cat + '. Üç bilgi veriyorum, içlerinden biri yanlış. ' +
                'Bakalım yanlış olanı bulabilecek misin?'],
        ['fact', set, 0],
        ['fact', set, 1],
        ['fact', set, 2],
        ['facts', set, 2200],                // düşünme payı
        ['reveal', set],
        ['mark', 'wrong', (set.wrong + 1) + '. bilgi', 1800],
        ['face', 'mutlu', 900]
      ];
    }
  };
  function d6(){ return 1 + Math.floor(Math.random() * 6); }

  /* ══════════ one screen ══════════ */

  var stages = [];
  var raf = null, lastTick = 0;

  function loop(t){
    raf = requestAnimationFrame(loop);
    if (t - lastTick < TICK) return;
    lastTick = t;
    var any = false;
    for (var i = 0; i < stages.length; i++){
      if (!stages[i].live()) continue;
      any = true;
      stages[i].step(t, false);
    }
    if (!any){ cancelAnimationFrame(raf); raf = null; }
  }
  function wake(){
    if (reduce || raf || document.hidden) return;
    for (var i = 0; i < stages.length; i++){
      if (stages[i].live()){ lastTick = 0; raf = requestAnimationFrame(loop); return; }
    }
  }
  function sleep(){ if (raf){ cancelAnimationFrame(raf); raf = null; } }
  document.addEventListener('visibilitychange', function(){ document.hidden ? sleep() : wake(); });

  function createStage(){
    var master = document.createElement('canvas');
    master.width = W; master.height = H;
    var g = master.getContext('2d');
    var targets = [];

    var want = 'sakin';
    var from = FACES.sakin, to = FACES.sakin, cur = FACES.sakin.slice();
    var idle = 0, idleAt = 0, morphAt = 0;
    var held = null, mask = null;            // mask = expression a script is showing
    var blinkAt = 0, blinkFor = -9999, t0 = null;
    var mouth = 20, mouthTarget = 20, mouthAt = 0;
    var sacX = 0, sacY = 0, sacAt = 0, gazeX = 0, gazeY = 0, wobble = 0;
    var speaking = false, screen = null;
    var script = null, scriptTimer = null, onIdle = null, data = {};
    var bubbleEl = null, txtEl = null, sayTimer = null, hideTimer = null;
    var reactAt = -9999;

    /* ---------- painting ---------- */

    function paint(all){
      for (var i = 0; i < targets.length; i++){
        var tg = targets[i];
        if (!tg.ctx || (!all && !tg.live)) continue;
        tg.ctx.drawImage(master, 0, 0, tg.w, tg.h);
        if (tg.tex) tg.tex.source.update();
      }
    }

    function step(t, force){
      if (t0 === null){ t0 = t; idleAt = t; morphAt = t; blinkAt = t + rand(1800, 3600); mouthAt = t; sacAt = t; }

      // the idle playlist stands still while a script or a card pick is in charge
      if (!mask && !held && t - idleAt > PLAY[idle][1]){ idle = (idle + 1) % PLAY.length; idleAt = t; }

      var next = mask || held || PLAY[idle][0];
      if (next !== want){
        want = next; from = cur.slice(); to = FACES[next] || FACES.sakin;
        morphAt = t; idleAt = t;
      }

      var k = MORPH ? ease(clamp((t - morphAt) / MORPH, 0, 1)) : 1;
      var p = [];
      for (var i = 0; i < from.length; i++) p.push(lerp(from[i], to[i], k));

      // the mouth always eases toward its target, so speech blends in and out
      var open = p[9];
      if (speaking || want === 'konusuyor'){
        if (t - mouthAt > rand(90, 160)){ mouthAt = t; mouthTarget = [14, 26, 44, 66][Math.floor(Math.random() * 4)]; }
        open = mouthTarget;
      }
      mouth += (open - mouth) * (MORPH ? 0.42 : 1);
      p[9] = mouth;
      cur = p.slice();                       // base face, before blink and drift

      if (!reduce){
        if (t > blinkAt){ blinkFor = t; blinkAt = t + rand(2600, 6000); }
        var since = t - blinkFor, b = 0;
        if (since < 170) b = since < 70 ? since / 70 : 1 - (since - 70) / 100;
        if (b > 0) for (var e = 0; e < 8; e++) p[e] = lerp(p[e], BLINK[e % 4], b);

        if (t - sacAt > rand(1400, 3000)){ sacAt = t; sacX = rand(-7, 7); sacY = rand(-4, 4); }
        var s = (t - t0) / 1000;
        p[11] += 6 * Math.sin(s * 0.45) + sacX;
        p[12] += 4 * Math.sin(s * 0.31) + sacY;

        // a shake leaves it briefly cross-eyed and swimming
        if (wobble > 0.01){
          p[11] += Math.sin(t / 70) * 16 * wobble;
          p[12] += Math.cos(t / 55) * 8 * wobble;
          wobble *= 0.97;
        }
      }
      p[11] += gazeX; p[12] += gazeY;
      gazeX *= 0.88; gazeY *= 0.88;

      clear(g);
      if (screen) drawScreen(g, screen, t);
      else drawFace(g, p);
      paint(force);
    }

    /** repaint right now — the RAF loop may well be asleep */
    function kick(){ if (!raf) step(now(), true); else paint(true); }

    /* ---------- speech bubble ---------- */

    function bubble(el){
      bubbleEl = el;
      txtEl = el ? el.querySelector('.txt') || el : null;
    }

    /** stop talking; `keep` lets the last bubble fade out on its own schedule */
    function hush(keep){
      clearTimeout(sayTimer);
      sayTimer = null;
      speaking = false;
      if (keep) return;
      clearTimeout(hideTimer);
      hideTimer = null;
      if (bubbleEl) bubbleEl.removeAttribute('data-on');
    }

    /**
     * Show a line in the bubble, one word at a time like someone typing, with the
     * mouth moving for exactly as long as words keep appearing. Returns how long
     * the whole line takes so a script can wait for it.
     */
    function say(text){
      hush();
      if (!txtEl) return 700;
      var words = String(text).split(/\s+/).filter(Boolean);
      var spans = [], total = 0, delays = [];
      txtEl.textContent = '';
      words.forEach(function(w, i){
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = w + (i < words.length - 1 ? ' ' : '');
        txtEl.appendChild(s);
        spans.push(s);
        var d = clamp(90 + 34 * w.length, 130, 420);
        delays.push(d);
        total += d;
      });
      bubbleEl.setAttribute('data-on', '');
      var tail = clamp(1200 + 26 * String(text).length, 1600, 3400);

      if (reduce){
        spans.forEach(function(s){ s.className = 'w on'; });
        hideTimer = setTimeout(function(){ if (bubbleEl) bubbleEl.removeAttribute('data-on'); }, tail);
        return tail;
      }

      speaking = true;
      var i = 0;
      (function next(){
        if (i >= spans.length){
          speaking = false;
          return;
        }
        spans[i].className = 'w on';
        sayTimer = setTimeout(next, delays[i++]);
      })();
      hideTimer = setTimeout(function(){
        if (bubbleEl) bubbleEl.removeAttribute('data-on');
      }, total + tail);
      wake();
      return total + Math.min(tail, 900);
    }

    /* ---------- scripts ---------- */

    function stop(){
      clearTimeout(scriptTimer); scriptTimer = null;
      script = null; mask = null; screen = null;
      hush(true);
      kick();
    }

    function enter(s, t){
      var kind = s[0];
      if (kind === 'say'){ screen = null; return say(typeof s[1] === 'function' ? s[1](data) : s[1]); }
      if (kind === 'face'){
        screen = null;
        var nm = typeof s[1] === 'function' ? s[1](data) : s[1];
        mask = FACES[nm] ? nm : null;
        return s[2] || 800;
      }
      if (kind === 'dice'){
        data.dice = d6();
        screen = { kind: 'dice', value: data.dice, show: data.dice, at: t, from: t, until: t + (s[1] || 1600) };
        return s[1] || 1600;
      }
      if (kind === 'word'){
        screen = { kind: 'word', en: s[1][0], tr: s[1][1] };
        return s[2] || 1500;
      }
      if (kind === 'timer'){
        screen = { kind: 'timer', label: '25:00', note: 'odak', from: t, until: t + (s[1] || 2400) };
        return s[1] || 2400;
      }
      if (kind === 'wheel'){
        screen = { kind: 'wheel', index: s[1], from: t, until: t + (s[2] || 2400) };
        return s[2] || 2400;
      }
      if (kind === 'facts'){
        screen = { kind: 'facts', set: s[1], active: -1, reveal: false };
        return s[2] || 1600;
      }
      // these two talk *and* keep the list on screen, so the bubble reads out the
      // statement the highlighted row is showing
      if (kind === 'fact'){
        var ms = say(s[1].items[s[2]][1]);
        screen = { kind: 'facts', set: s[1], active: s[2], reveal: false };
        return ms;
      }
      if (kind === 'reveal'){
        var set = s[1];
        var told = say('Yanlış olan ' + (set.wrong + 1) + '. bilgi. ' + set.why);
        screen = { kind: 'facts', set: set, active: set.wrong, reveal: true };
        return told;
      }
      if (kind === 'mark'){
        screen = { kind: 'mark', mark: s[1], label: s[2] || '' };
        return s[3] || 1500;
      }
      return 400;
    }

    function run(steps){
      stop();
      script = steps;
      var i = 0;
      (function next(){
        if (!script) return;                   // superseded by another scene
        if (i >= script.length){ stop(); if (onIdle) onIdle(); return; }
        var ms = enter(script[i++], now());
        kick();
        wake();
        scriptTimer = setTimeout(next, Math.max(120, ms));
      })();
    }

    function play(name){
      var make = SCENES[name];
      if (!make) return false;
      run(make());
      return true;
    }

    /** a short reaction — skipped while a scene is talking, and rate limited so
        wiggling the model does not turn into a monologue */
    function react(face, text){
      var t = now();
      if (script || t - reactAt < 2600) return false;
      reactAt = t;
      run([['face', face, 600], ['say', text]]);
      return true;
    }

    function flash(face, ms){
      if (script) return;
      run([['face', face, ms || 1400]]);
    }

    /* ---------- inputs ---------- */

    function hold(name){
      held = FACES[name] ? name : null;
      kick();
      wake();
    }

    function look(dx, dy){
      gazeX = clamp(gazeX + (dx || 0), -30, 30);
      gazeY = clamp(gazeY + (dy || 0), -18, 18);
      wake();
    }
    function spin(amount){ wobble = clamp(wobble + amount, 0, 1); wake(); }

    /* ---------- surfaces to paint on ---------- */

    function watch(tg, node){
      tg.live = !reduce;
      targets.push(tg);
      new IntersectionObserver(function(entries){
        entries.forEach(function(e){ tg.live = e.isIntersecting; });
        if (isLive()) wake(); else sleep();
      }, { threshold: 0 }).observe(node);
      return tg;
    }

    function attach(mv){
      var model = mv.model;
      if (!model) return;
      var mat = null;
      for (var i = 0; i < model.materials.length; i++){
        if (model.materials[i].name === 'iva-screen'){ mat = model.materials[i]; break; }
      }
      if (!mat) return;                      // a model without a baked screen
      Promise.resolve(mat.ensureLoaded ? mat.ensureLoaded() : null).then(function(){
        var tex = mv.createCanvasTexture();
        var cv = tex.source.element;
        cv.width = W; cv.height = H;
        mat.setEmissiveFactor([1, 1, 1]);
        mat.emissiveTexture.setTexture(tex);
        // Canvas textures keep three.js's default flipY while the baked UVs follow
        // glTF's top-left origin, so flip V back — after setTexture has reapplied
        // the slot's own (identity) transform.
        if (tex.sampler && tex.sampler.setScale){
          tex.sampler.setScale({ u: 1, v: -1 });
          tex.sampler.setOffset({ u: 0, v: 1 });
        }
        var tg = null;
        for (var j = 0; j < targets.length; j++) if (targets[j].mv === mv) tg = targets[j];
        if (!tg) tg = watch({ mv: mv, w: W, h: H }, mv);
        tg.tex = tex;
        tg.ctx = cv.getContext('2d');
        kick();
        wake();
      })['catch'](function(){ /* the screen is decoration — never break the page */ });
    }

    function preview(canvas){
      var tg = watch({ w: canvas.width, h: canvas.height }, canvas);
      tg.ctx = canvas.getContext('2d');
      kick();
      wake();
    }

    function isLive(){
      for (var i = 0; i < targets.length; i++) if (targets[i].live) return true;
      return false;
    }

    var stage = {
      step: step, live: isLive,
      attach: attach, preview: preview, bubble: bubble,
      hold: hold, flash: flash, react: react, say: say,
      play: play, stop: stop, look: look, spin: spin,
      onIdle: function(fn){ onIdle = fn; },
      busy: function(){ return !!script; }
    };
    stages.push(stage);
    return stage;
  }

  /* ══════════ being played with ══════════
     model-viewer already turns the device when you drag it; these are the little
     reactions on top — the eyes lead the turn, shaking it makes it dizzy, tipping
     it up and down cheers it up, and looking at its back is rude.               */

  function gestures(mv, stage){
    var lastTheta = null, lastPhi = null, dir = 0, revs = [], tilt = 0, behind = false;

    mv.addEventListener('camera-change', function(e){
      if (!e.detail || e.detail.source !== 'user-interaction') return;
      var o = mv.getCameraOrbit();
      var th = o.theta * 180 / Math.PI, ph = o.phi * 180 / Math.PI, t = now();

      if (lastTheta !== null){
        var d = th - lastTheta;
        stage.look(clamp(-d * 2.4, -26, 26), 0);

        var nd = d > 0.5 ? 1 : d < -0.5 ? -1 : dir;
        if (dir !== 0 && nd !== 0 && nd !== dir) revs.push(t);
        dir = nd;
        revs = revs.filter(function(x){ return t - x < 1500; });
        if (revs.length >= 3){
          revs = [];
          stage.spin(1);
          stage.react('saskin', 'Başım döndü, biraz yavaş!');
        }

        tilt += Math.abs(ph - lastPhi);
        if (tilt > 30){
          tilt = 0;
          stage.react('mutlu', 'Yukarı aşağı — bu hoşuma gitti.');
        }
      }

      // the screen is out of sight back there, so the bubble does the talking
      var norm = ((th + 180) % 360 + 360) % 360 - 180;
      var isBehind = Math.abs(norm) > 115;
      if (isBehind && !behind) stage.react('sinirli', 'Arkamda ne arıyorsun?');
      if (!isBehind && behind) stage.flash('sinirli', 1500);
      behind = isBehind;

      lastTheta = th; lastPhi = ph;
    });
  }

  window.IvaScreen = {
    FACES: FACES,
    SCENES: SCENES,
    svg: svg,
    createStage: createStage,
    gestures: gestures,
    reduce: reduce
  };
})();
