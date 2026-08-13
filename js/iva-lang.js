/**
 * iva-lang.js — TR ⇄ EN dil geçişi.
 *
 * Sayfa Türkçe yazıldı; İngilizce sürüm burada, Türkçe metnin kendisiyle
 * anahtarlanmış bir sözlük olarak duruyor. Geçiş, metin düğümlerini ve
 * çevrilebilir nitelikleri (placeholder, aria-label, title, alt) gezip
 * değiştiriyor — HTML'e tek bir data-i18n eklemeye gerek kalmıyor.
 *
 * İva'nın kendi konuşmaları Türkçe kalıyor: ürünün bütün iddiası Türkçe konuşan
 * bir asistan olması. İngilizce arayüzde bunu açıklayan bir satır var.
 */
(function(){
  'use strict';

  var KEY = 'iva-lang';

  /** boşlukları sadeleştir; HTML'deki satır kırıkları anahtarı bozmasın */
  function norm(s){ return String(s).replace(/\s+/g, ' ').trim(); }

  var EN = {
    /* ── navigasyon, hero ── */
    'bekleme listesi': 'waitlist',
    'iva yükleniyor…': 'loading iva…',
    'geliştirme aşamasında': 'in development',
    'sen konuş,': 'you talk,',
    'iva halletsin.': 'iva handles it.',
    'Tamamen Türkçe konuşan bir masaüstü asistanı. Not alır, hatırlatır, yönlendirir — klavyeye dokunmadan, ekrana basmadan.':
      'A desk assistant that speaks Turkish end to end. It takes notes, reminds you and gives directions — no keyboard, no screen to tap.',
    'keşfet': 'explore',
    '🗣️ ingilizce öğret': '🗣️ teach english',
    '⏱️ odak başlat': '⏱️ start focus',
    '😄 şaka yap': '😄 tell a joke',
    '🎲 zar at': '🎲 roll a die',
    '🪙 yazı tura': '🪙 flip a coin',
    '🎡 çark çevir': '🎡 spin the wheel',
    '🧠 3 bilgi': '🧠 3 facts',
    'modeli sürükle — sallarsan başı döner, ters çevirirsen hoşuna gitmez · ekran, geliştirilmekte olan cihazın tarayıcıdaki simülasyonu':
      'drag the model — shake it and it gets dizzy, turn its back and it sulks · the screen is a browser simulation of the device we are building · iva speaks Turkish, so its lines stay in Turkish',

    /* ── şerit ── */
    'baştan sona türkçe': 'turkish through and through',
    'dokunmatik ekran gerekmez': 'no touchscreen needed',
    'veri cihazda kalabilir': 'data can stay on device',
    'esp32-s3 tabanlı': 'built on esp32-s3',
    'avuç içi boyutunda': 'palm sized',
    'prototip aşamasında': 'still a prototype',

    /* ── dokunmadan ── */
    'dokun-': 'hands-',
    'madan': 'free',
    'bugün nasıl oluyor': 'how it goes today',
    'Toplantı ve derste yazmakla uğraşırken konuşmayı kaçırmak': 'Missing half the talk because you were busy writing it down',
    'Not, hatırlatıcı ve zamanlayıcı için ayrı ayrı uygulamalar': 'A separate app for notes, another for reminders, another for timers',
    'Danışmada sıra bekleyen insanlar, meşgul personel': 'A queue at the desk and staff who are already busy',
    'Dokunmatik kiosk: herkesin bastığı yüzey, küçük yazılar, karmaşık menü': 'Touch kiosks: a surface everyone presses, tiny type, menus within menus',
    'İngilizce sesli asistanlarla Türkçe boğuşmak': 'Wrestling Turkish through an English-first voice assistant',
    'iva ile nasıl olacak': 'how it goes with iva',
    'Sen dinlerken o not alır — bir cümle söylemen yeter': 'You listen, it writes — one sentence is enough',
    'Not, görev, hatırlatma ve odak; hepsi tek cihazda': 'Notes, tasks, reminders and focus, all on one device',
    'Sık sorulan soruları cihaz karşılar, personel asıl işine döner': 'The device fields the repeat questions so staff get back to real work',
    'Hiçbir yere dokunmadan, sesle: hijyenik ve erişilebilir': 'Nothing to touch, just your voice: hygienic and accessible',
    'Baştan sona akıcı, doğal Türkçe': 'Natural, fluent Turkish from start to finish',
    'Notlar dağılıyor, tarihler unutuluyor,': 'Notes scatter, dates slip,',
    'danışmadaki kuyruk uzuyor.': 'the queue at the desk keeps growing.',
    'İva bunların hepsine tek bir yerden, konuşarak cevap veriyor. Masanın üstünde duruyor; sen konuşurken dinliyor, yazıya döküyor, zamanı gelince hatırlatıyor.':
      'İva answers all of it from one place, by voice. It sits on your desk, listens while you talk, writes things down and reminds you when the time comes.',
    'Ekrana bakmak, klavyeye uzanmak ya da bir menüde gezinmek gerekmiyor. Tek yapman gereken cümleyi kurmak.':
      'No looking at a screen, no reaching for a keyboard, no digging through menus. All you do is say the sentence.',

    /* ── avuç içi / senaryolar ── */
    'avuç-': 'palm-',
    'içi': 'sized',
    'öğrenci': 'student',
    'Ders anlatılırken not tutmak': 'Taking notes during a lecture',
    'Hoca hızlı anlatıyor, yazmaya çalışırken yarısını kaçırıyorsun. İva dinlediklerini yazıya döküyor.':
      'The lecturer moves fast and you miss half of it while writing. İva writes down what it hears.',
    '"İva, not al: final konuları 4. üniteden başlıyor."': '"İva, note this: the final starts from unit 4."',
    'profesyonel': 'professional',
    'Toplantı çıkışı özet ve aksiyonlar': 'A summary and action items after the meeting',
    'Toplantı biter bitmez kararları ve kimin ne yapacağını sesle kaydediyorsun.':
      'The moment the meeting ends you dictate the decisions and who does what.',
    '"Toplantı notu: teklif pazartesiye hazırlanacak, sorumlu Ayşe."': '"Meeting note: proposal ready by Monday, Ayşe owns it."',
    'Teslim tarihlerini kaçırmamak': 'Never missing a deadline',
    'Ödev, vize, proje… hepsi söylediğin anda takvimine giriyor, zamanı gelince hatırlatılıyor.':
      'Homework, midterms, projects — each one lands in your calendar as you say it, and comes back as a reminder.',
    '"Salı 17.00\'de proje teslimi var, bir gün önce hatırlat."': '"Project is due Tuesday at 5pm, remind me a day before."',
    'uzaktan çalışan': 'remote worker',
    'Odak seansı yönetmek': 'Running a focus session',
    'Telefonu eline almadan Pomodoro başlatıyorsun. İva süreyi tutuyor, molayı hatırlatıyor.':
      'You start a Pomodoro without picking up your phone. İva keeps the time and calls the break.',
    '"Pomodoro başlat, bittiğinde haber ver."': '"Start a Pomodoro, tell me when it is up."',
    'dil öğrenen': 'language learner',
    'Her gün 10 dakika pratik': 'Ten minutes of practice a day',
    'Karşında biri olmadan İngilizce konuşmak zor. İva sohbet ediyor, hatalarını düzeltiyor.':
      'Speaking English is hard with nobody across from you. İva chats back and corrects you.',
    '"Benimle 10 dakika İngilizce konuş, sonra hatalarımı söyle."': '"Talk English with me for ten minutes, then tell me my mistakes."',
    'sağlık · poliklinik': 'healthcare · clinic',
    'Danışmadaki tekrar eden sorular': 'The questions the front desk hears all day',
    'Gün boyu yüzlerce kez sorulan yön sorularını İva karşılıyor, personel asıl işine dönüyor.':
      'İva handles the directions asked hundreds of times a day, and staff get back to their real work.',
    '"Kan alma birimi nerede?"': '"Where is the blood draw unit?"',
    'sağlık · bekleme salonu': 'healthcare · waiting room',
    'Hijyenik bilgilendirme': 'Information without contact',
    'Ortak dokunulan yüzey yok. Randevu saatini ya da hazırlık talimatını sorman yeterli.':
      'No shared surface to touch. Just ask for your appointment time or how to prepare.',
    '"Tahlil öncesi aç kalmam gerekiyor mu?"': '"Do I need to fast before the test?"',
    'avm · yönlendirme': 'mall · wayfinding',
    'Mağaza ve kat bulma': 'Finding a shop or a floor',
    'Kiosk menüsünde kaybolmak yerine mağazanın adını söylüyorsun; İva yönü tarif ediyor.':
      'Instead of getting lost in a kiosk menu you say the shop name and İva gives you directions.',
    '"Sinema kaçıncı katta, nasıl giderim?"': '"Which floor is the cinema on, how do I get there?"',
    'erişilebilirlik': 'accessibility',
    'Ekran okumakta zorlananlar': 'For anyone who struggles with screens',
    'Görme zorluğu yaşayan ya da küçük yazıları okuyamayan biri için ses en doğal arayüz.':
      'For someone with low vision, or who simply cannot read small type, voice is the most natural interface there is.',
    '"Randevum saat kaçtaydı?"': '"What time was my appointment?"',
    'Masanın köşesine sığacak kadar küçük.': 'Small enough for the corner of a desk.',
    'Günü değiştirecek kadar işe yarar.': 'Useful enough to change your day.',
    'İva avuç içi büyüklüğünde bir cihaz olarak tasarlanıyor: masanın üstünde, kliniğin danışmasında ya da AVM\'nin ortasında aynı işi görecek kadar küçük.':
      'İva is designed to be palm sized: small enough to do the same job on a desk, at a clinic reception or in the middle of a mall.',
    'Bir kiosk\'un kapladığı yere birden fazla İva kurulabilir — üstelik kimsenin ekrana dokunmasına gerek kalmadan.':
      'You can put several İvas in the space one kiosk takes — and nobody has to touch a screen.',

    /* ── içini aç ── */
    'içini': 'look',
    'aç': 'inside',
    'ürün': 'product',
    'parçalar': 'parts',
    'sürükleyip çevir': 'drag to turn',
    'bir parçaya tıkla': 'click a part',
    'kutunun içinde': 'inside the box',
    'Bir parçaya tıkla, modelde nerede olduğunu göster.': 'Click a part to see where it sits in the model.',
    'Model, prototipin güncel 3B tasarımından alındı. Renkler parçaları ayırt etmek için verildi; nihai üründe gövde tek renk olacak. Parça isimleri prototip sürecinde değişebilir.':
      'The model comes from the prototype\'s current 3D design. The colours are only there to tell the parts apart; the shipping body will be a single colour. Part names may still change.',
    'Kapalı kutu değil.': 'Not a sealed box.',
    'Ne olduğunu görebilirsin.': 'You can see what is in it.',
    'İva, ESP32-S3 tabanlı açık bir donanım mimarisi üzerine kuruluyor: mikrofon dizisi, hoparlör ve 1.69 inçlik küçük bir ekran.':
      'İva is built on an open, ESP32-S3 based hardware architecture: a microphone array, a speaker and a small 1.69-inch screen.',
    'Modeli sürükleyerek çevir, "parçalar" görünümüne geçip kutunun içinde ne olduğunu tek tek incele.':
      'Drag to turn the model, then switch to the "parts" view and go through what is inside one by one.',

    /* ── komutlar ── */
    'tek': 'one',
    'cümle': 'sentence',
    '✅ verimlilik': '✅ productivity',
    '🗣️ dil ve öğrenme': '🗣️ language & learning',
    '💻 bilgisayar kontrolü': '💻 computer control',
    '🧮 hesap ve bilgi': '🧮 maths & facts',
    '🎮 mola': '🎮 downtime',
    'İva, not al: proje teslimi cumaya çekildi': 'İva, note this: the project deadline moved to Friday',
    'Notunu anında kaydeder, istersen telefonuna iletir.': 'Saves the note at once and can forward it to your phone.',
    'Yarınki vize sınavımı hatırlat': 'Remind me about tomorrow\'s midterm',
    'Hatırlatma kurar, zamanı gelince seni uyarır.': 'Sets a reminder and nudges you when the time comes.',
    'Görev ekle: makale taslağını bitir': 'Add a task: finish the article draft',
    'Yapılacaklar listene ekler, bitince işaretler.': 'Adds it to your to-do list and ticks it off when done.',
    'Pomodoro başlat': 'Start a Pomodoro',
    '25 dakikalık odak sayacı başlatır, molanı hatırlatır.': 'Starts a 25-minute focus timer and calls your break.',
    'Bugünkü çalışmalarımı günlüğüme yaz': 'Write today\'s work into my journal',
    'Günün özetini tutar, ne yaptığını takip edersin.': 'Keeps a daily record so you can see what you actually did.',
    'Bugün 2 saat çalıştım, alışkanlığa ekle': 'I studied two hours today, add it to my streak',
    'Çalışma serilerini takip eder, motive tutar.': 'Tracks your streaks and keeps you going.',
    'Cumartesi 14.00\'e diş randevusu ekle': 'Add a dentist appointment Saturday at 2pm',
    'Takvimine etkinlik ekler, listeler, gerekirse iptal eder.': 'Adds events to your calendar, lists them, cancels them if needed.',
    'Günün özetini geç': 'Give me the day\'s summary',
    'Akşam notlarını, görevlerini ve serilerini toplayıp özetler.': 'Pulls your notes, tasks and streaks together at the end of the day.',
    'İva, benimle İngilizce pratik yap': 'İva, practise English with me',
    'Seninle İngilizce sohbet eder, hatalarını nazikçe düzeltir.': 'Chats with you in English and corrects you gently.',
    'Bunu Çince nasıl söylerim?': 'How do I say this in Chinese?',
    'Kelime ve cümleleri telaffuzuyla birlikte öğretir.': 'Teaches words and phrases along with the pronunciation.',
    'Bana 5 yeni İngilizce kelime öğret': 'Teach me five new English words',
    'Örnek cümlelerle kelime dağarcığını büyütür.': 'Grows your vocabulary with example sentences.',
    'Şu cümleyi İngilizceye çevir': 'Translate this sentence into English',
    'Anında Türkçe ↔ İngilizce / Çince çeviri yapar.': 'Translates Turkish ↔ English / Chinese on the spot.',
    'Gmail\'i aç': 'Open Gmail',
    'İstediğin siteyi tarayıcında açar.': 'Opens any site you name in your browser.',
    'Web\'de kaynak makale ara': 'Search the web for a source article',
    'Senin için arama yapar, sonucu açar.': 'Runs the search for you and opens the result.',
    'Odaklanmak için bir müzik aç': 'Put on some focus music',
    'Bulur ve bilgisayarında çalar.': 'Finds it and plays it on your computer.',
    'Bu notları telefonuma gönder': 'Send these notes to my phone',
    'Notunu ya da mesajını telefonuna iletir.': 'Forwards your note or message to your phone.',
    'Ayşe\'ye mail at: dosya yarın hazır': 'Email Ayşe: the file will be ready tomorrow',
    'Kayıtlı kişilere e-posta yazıp gönderir.': 'Writes and sends email to your saved contacts.',
    'Spotify\'da çalışma listemi aç': 'Open my study playlist on Spotify',
    'Şarkıyı bulur, çalar, sesi sen söyledikçe ayarlar.': 'Finds the track, plays it, and sets the volume as you say.',
    'Kod editörünü aç': 'Open my code editor',
    'Bilgisayarındaki uygulamayı senin için başlatır.': 'Launches the app on your computer for you.',
    '247 çarpı 18 kaç eder?': 'What is 247 times 18?',
    'İşlemleri anında sesli olarak çözer.': 'Works it out and says the answer.',
    'Bugün İstanbul\'da hava nasıl?': 'What is the weather in Istanbul today?',
    'Güncel hava durumunu söyler.': 'Tells you the current forecast.',
    'Saat kaç, teslime kaç gün var?': 'What time is it, how many days to the deadline?',
    'Tarih ve saati anında bildirir.': 'Gives you the date and time straight away.',
    'Bugün verimliydim, moralim iyi': 'I was productive today, feeling good',
    'Ruh halini kaydeder, zamanla geçmişini tutar.': 'Logs your mood and keeps the history over time.',
    'Çarkı çevir': 'Spin the wheel',
    'Bilim, Sanat, Spor, Tarih, Coğrafya, Eğlence — ekranda döner, bir kategoride durur, oradan soru sorar.':
      'Science, Art, Sport, History, Geography, Entertainment — it spins on screen, lands on one, and asks you a question from it.',
    'Üç bilgi ver, biri yanlış olsun': 'Give me three facts, one of them false',
    'Üç bilgiyi sırayla okur, yanlış olanı bulmanı ister; ekranda tik ve çarpı çıkar.':
      'Reads the three out in turn and asks you to spot the false one; ticks and crosses appear on screen.',
    'Skorlu quiz başlat': 'Start a scored quiz',
    'Soru sorar, skoru tutar, doğru-yanlış sesiyle geri bildirim verir.': 'Asks questions, keeps score, and answers back with a right/wrong chime.',
    'Şarkı tahmin oyunu oyna': 'Play the song guessing game',
    'Bir şarkının ortasından kısa bir parça çalar, hangisi olduğunu sorar.': 'Plays a snippet from the middle of a track and asks which one it is.',
    'Bana bilmece sor': 'Ask me a riddle',
    'Bilmece, 20 soru, tabu, kelime zinciri, şehir-isim-hayvan, hikâye zinciri.': 'Riddles, 20 questions, taboo, word chains, name-place-animal, story chains.',
    'Zar at, yazı tura at': 'Roll a die, flip a coin',
    'Zar ekranda döner ve bir sayıda durur; para yazı-tura arasında döner.': 'The die tumbles on screen and settles on a number; the coin turns between heads and tails.',
    'Bana bir şaka yap': 'Tell me a joke',
    'Kısa bir espriyle stres molası verir.': 'A quick one-liner for a breather.',
    'Duygulu yüzüyle eşlik eder': 'Its face plays along',
    'Konuşmana göre güler, şaşırır, göz kırpar.': 'It smiles, looks surprised and winks along with the conversation.',
    'Konuştuğun şeye göre yüzü değişir.': 'Its face changes with what you say.',
    'cihazın ekranı': 'the device screen',
    'Küçük ekranındaki yüz, konuşmanın gidişatına göre gülüyor, şaşırıyor, göz kırpıyor. Oyun oynarken ekran zarı, çarkı, doğru-yanlış işaretlerini de gösteriyor; cihazla konuşmak bir menüyle uğraşmaktan çok, birine seslenmeye benziyor.':
      'The face on the little screen smiles, looks surprised and winks as the conversation goes. During a game the screen also shows the die, the wheel and the right/wrong marks — talking to it feels less like using a menu and more like calling out to someone.',
    'Bir ifadeye dokun: hem yandaki ekran hem de yukarıdaki 3B model o ifadeye geçsin. Aynı ifadeye tekrar dokunursan otomatik akışa döner.':
      'Tap an expression and both the screen here and the 3D model above switch to it. Tap the same one again to go back to the automatic loop.',

    /* ── kurumsal ── */
    'kurum-': 'enter-',
    'sal': 'prise',
    'sağlık kuruluşları': 'healthcare',
    'hastane · poliklinik · laboratuvar': 'hospital · clinic · laboratory',
    'Bölüm, kat ve birim yönlendirmesi — danışmadaki yükü azaltır': 'Directions to departments, floors and units — takes load off the front desk',
    'Tahlil öncesi hazırlık talimatlarını sesli anlatır': 'Reads out how to prepare before a test',
    'Randevu ve sıra durumu sorularını karşılar': 'Handles appointment and queue questions',
    'Ortak dokunulan yüzey yok; enfeksiyon kontrolü açısından avantajlı': 'No shared surface to touch — a real advantage for infection control',
    'Ziyaret saatleri, otopark, kafeterya gibi tekrar eden soruları üstlenir': 'Takes on the repeat questions: visiting hours, parking, cafeteria',
    'Veriler kurum içinde kalabilir; bulut zorunlu değil': 'Data can stay inside the institution; the cloud is optional',
    'avm ve perakende': 'malls & retail',
    'alışveriş merkezi · mağaza · fuar': 'shopping centre · store · trade fair',
    'Mağaza, kat ve marka arama — menüde gezinmeye gerek yok': 'Search shops, floors and brands — no menu to navigate',
    'Güncel kampanya, etkinlik ve seans saatleri': 'Current promotions, events and showtimes',
    'Otopark, tuvalet, bebek bakım odası gibi konum soruları': 'Where-is questions: parking, toilets, baby changing room',
    'Birden çok noktaya dağıtılabilecek kadar küçük ve ucuz': 'Small and cheap enough to put in several places at once',
    'İçerik tek yerden güncellenir, tüm cihazlara yansır': 'Update the content in one place and every device follows',
    'Ziyaretçinin ne sorduğu, hangi mağazanın arandığı ölçülebilir': 'What visitors ask and which shops they look for becomes measurable',
    'hijyen': 'hygiene',
    'Kimse ortak bir ekrana dokunmaz. Sağlık ortamında tek başına belirleyici bir fark.':
      'Nobody touches a shared screen. In a healthcare setting that alone is decisive.',
    'Görme zorluğu, yaş, boy veya tekerlekli sandalye yüksekliği engel olmaz.':
      'Low vision, age, height or wheelchair height stop being obstacles.',
    'hız': 'speed',
    'Beş menü derinliği yerine tek cümle. Ortalama etkileşim süresi kısalır.':
      'One sentence instead of five menu levels. Average interaction time drops.',
    'alan ve maliyet': 'space & cost',
    'Avuç içi büyüklüğünde. Bir kiosk\'un yerine birden fazla nokta kurulabilir.':
      'Palm sized. Several points fit in the space of a single kiosk.',
    'Dokunmatik kiosk\'a sesli alternatif.': 'A voice alternative to the touch kiosk.',
    'Büyük ekranlı yönlendirme kiosk\'ları pahalı, yer kaplıyor ve herkes aynı yüzeye dokunuyor. Aynı işi konuşarak yapmak çoğu senaryoda daha hızlı, daha hijyenik ve daha erişilebilir.':
      'Big-screen wayfinding kiosks are expensive, take up room, and everyone touches the same surface. Doing the same job by voice is faster, cleaner and more accessible in most scenarios.',

    /* ── uygulama ── */
    'ekran': 'screen',
    'Ayarların tek ekranda.': 'Every setting on one screen.',
    'Anahtarlarını tek ekrandan gir, dosya düzenleme yok': 'Enter your keys on one screen — no config files to edit',
    'İva\'nın bağlantı durumunu anlık gör': 'See İva\'s connection status live',
    'Mesajlaşma bağlantını tek tuşla test et': 'Test your messaging link with one button',
    'İva\'nın seni nasıl tanıdığını düzenle': 'Edit how İva knows you',
    '⬇ Windows için indir': '⬇ Download for Windows',
    'Iva-Windows.zip · Windows 10/11': 'Iva-Windows.zip · Windows 10/11',
    'Nasıl kurulur:': 'How to install:',
    'İndirdiğin ZIP dosyasına sağ tıkla →': 'Right-click the ZIP you downloaded →',
    'Tümünü ayıkla': 'Extract all',
    ', sonra çıkan klasördeki': ', then run',
    'Iva.exe': 'Iva.exe',
    '\'yi çalıştır. Windows tanımadığı programlar için uyarı gösterirse': 'from the folder. If Windows warns about an unrecognised program,',
    'Ek bilgi': 'More info',
    'Yine de çalıştır': 'Run anyway',
    'ile devam edebilirsin.': 'will let you carry on.',
    '✓ Ücretsiz · ✓ Kurulum gerektirmez · ✓ Verilerin bilgisayarında kalır':
      '✓ Free · ✓ No installer · ✓ Your data stays on your computer',

    /* ── yol haritası ── */
    'yol hari-': 'road-',
    'tası': 'map',
    'tamamlandı': 'done',
    'Kavram ve tasarım': 'Concept and design',
    'Endüstriyel tasarım, donanım seçimi ve Türkçe sesli etkileşim akışı.': 'Industrial design, hardware choices and the Turkish voice interaction flow.',
    'şu an burada': 'we are here',
    'Prototip ve test': 'Prototype and testing',
    'Çalışan prototip, masaüstü uygulaması ve gerçek ortamda kullanım denemeleri.': 'A working prototype, the desktop app, and trials in real settings.',
    'sırada': 'next up',
    'Pilot ve lansman': 'Pilots and launch',
    'Kurumsal pilot uygulamalar, üretim planı ve fiyatlandırmanın açıklanması.': 'Institutional pilots, a production plan, and pricing announced.',
    'İva henüz satışta değil.': 'İva is not on sale yet.',
    'Şu an prototip geliştirme ve saha testi aşamasındayız. Paketler, fiyatlar ve teslim koşulları ürün hazır olduğunda burada yayınlanacak.':
      'We are still in prototype development and field testing. Packages, prices and delivery terms will be published here once the product is ready.',
    'Satış yok, ön sipariş yok, ödeme yok — sadece haber.': 'No sales, no pre-orders, no payment — just news.',
    'bekleme listesine katıl': 'join the waitlist',

    /* ── sorular ── */
    'sorular': 'questions',
    'İva\'yı şimdi satın alabilir miyim?': 'Can I buy İva now?',
    'Hayır. İva şu anda geliştirme aşamasında bir prototip; satışa çıkmadı ve ön sipariş almıyoruz. Hazır olduğunda paketler ve fiyatlar bu sayfada yayınlanacak.':
      'No. İva is a prototype in development; it is not on sale and we are not taking pre-orders. Packages and prices will be published on this page when it is ready.',
    'Ne zaman çıkacak?': 'When will it launch?',
    'Kesin bir tarih vermiyoruz, çünkü henüz saha testi aşamasındayız. Gerçekçi bir takvim oluştuğunda ilk olarak bekleme listesindeki kişilere haber vereceğiz.':
      'We are not giving a date, because we are still field testing. As soon as there is a realistic timeline, the waitlist hears first.',
    'Gerçekten Türkçe mi anlıyor?': 'Does it really understand Turkish?',
    'Evet, baştan sona Türkçe: hem seni anlar hem de doğal Türkçe yanıt verir. Uyandırma kelimesini de istediğin gibi değiştirebilirsin.':
      'Yes, Turkish end to end: it understands you and answers in natural Turkish. You can change the wake word to whatever you like.',
    'Verilerim nereye gidiyor?': 'Where does my data go?',
    'Mimari, tüm işlemin kendi bilgisayarında veya kurum içi bir sunucuda çalışmasına izin verecek şekilde tasarlanıyor. Bu modda notların ve konuşmaların buluta gitmez.':
      'The architecture is designed so the whole thing can run on your own computer or an on-premises server. In that mode your notes and conversations never reach a cloud.',
    'Kurumsal pilot uygulama yapabilir miyiz?': 'Can we run an institutional pilot?',
    'Evet, en çok ihtiyacımız olan şey bu. Hastane, poliklinik, AVM veya benzeri bir ortamda denemek isterseniz bize yazın; senaryoyu birlikte kurgulayalım.':
      'Yes — it is the thing we need most. If you would like to try it in a hospital, clinic, mall or similar setting, write to us and we will design the scenario together.',
    'Dokunmatik kiosk yerine gerçekten kullanılabilir mi?': 'Can it really replace a touch kiosk?',
    'Yönlendirme, sık sorulan sorular ve bilgilendirme gibi senaryolarda evet. İmza, ödeme veya belge yazdırma gibi fiziksel çıktı gerektiren işlemler için kiosk hâlâ gerekli — İva bu senaryolarda kiosk\'un yükünü hafifletir.':
      'For wayfinding, frequent questions and information, yes. Anything needing a physical output — signatures, payment, printing a document — still needs a kiosk; İva takes the load off it.',
    'Donanım olarak ne kullanıyor?': 'What hardware does it use?',
    'Prototip ESP32-S3 tabanlı bir kart, mikrofon dizisi, hoparlör ve 1.69 inçlik ekran üzerine kurulu. "İçini aç" bölümündeki 3B modelden parçaları inceleyebilirsin.':
      'The prototype is built on an ESP32-S3 board, a microphone array, a speaker and a 1.69-inch screen. You can go through the parts in the 3D model in the "look inside" section.',

    /* ── CTA, footer ── */
    'iva çıkınca': 'be the first',
    'ilk sen bil.': 'to know.',
    'Bekleme listesine katıl; prototipten çıkıp gerçek bir ürüne dönüştüğünde, fiyatlar ve teslim koşulları belli olduğunda ilk haber sana gelsin.':
      'Join the waitlist and you will hear first when it stops being a prototype and becomes a real product, with prices and delivery terms.',
    'Bir sorunuz olursa lütfen iletişime geçmekten kaçınmayın.': 'If you have a question, please do not hesitate to get in touch.',
    'bize yazın': 'write to us',
    'dokunmadan': 'hands-free',
    'senaryolar': 'scenarios',
    'içini aç': 'look inside',
    'komutlar': 'commands',
    'kurumsal': 'enterprise',
    'uygulama': 'app',
    '© 2026 İva · Türkiye\'de tasarlanıyor': '© 2026 İva · designed in Türkiye',

    /* ── 3B parça listesi ── */
    '1. Dış kasa': '1. Outer shell',
    'Dış kasa ve havalandırma ızgarası': 'Outer shell and vent grille',
    '2. Anfi modülü': '2. Amplifier module',
    'MAX98357 I2S ses yükselteci': 'MAX98357 I2S audio amplifier',
    '3. Mikrofon modülü': '3. Microphone module',
    'INMP441 I2S MEMS mikrofon': 'INMP441 I2S MEMS microphone',
    '4. Şarj devresi': '4. Charging board',
    'TP4056 Type-C korumalı şarj kartı': 'TP4056 Type-C protected charging board',
    '5. Lityum pil': '5. Lithium battery',
    'Cihazı besleyen şarj edilebilir pil': 'Rechargeable cell that powers the device',
    '6. Hoparlör': '6. Speaker',
    'Sesli yanıt ve bildirim sesleri': 'Spoken replies and notification sounds',
    '7. Ön çerçeve': '7. Front frame',
    'Ekran çerçevesi ve ön kapak': 'Screen bezel and front cover',
    '8. Ekran ve beyin kartı': '8. Screen and main board',
    'Waveshare ESP32-S3, 1.69 inç dokunmatik ekran': 'Waveshare ESP32-S3, 1.69-inch touch screen',

    /* ── ifade kartları ── */
    'mutlu': 'happy',
    'şaşkın': 'surprised',
    'göz kırp': 'wink',
    'sakin': 'calm',
    'düşünen': 'thinking',
    'uykulu': 'sleepy',
    'konuşuyor': 'talking',
    'dinliyor': 'listening',
    'sinirli': 'annoyed',

    /* ── bekleme listesi sayfası ── */
    'ana sayfa': 'home',
    'bekleme': 'wait',
    'listesi': 'list',
    'İva, Türkçe konuşan meraklı bir masaüstü arkadaşı.': 'İva is a curious little desk companion that speaks Turkish.',
    'İva; sen konuşurken not alan, tarihleri hatırlatan ve soru sorana yol tarif eden, baştan sona Türkçe bir masaüstü asistanı olarak geliştiriliyor.':
      'İva is being built as a desk assistant that works entirely in Turkish: it takes notes while you talk, reminds you of dates, and gives directions to whoever asks.',
    'Fikir basit: bir şeyi halletmek için ekrana bakmak, klavyeye uzanmak ya da bir menüde gezinmek zorunda olmamalısın. Cümleyi kur, gerisini İva yapsın.':
      'The idea is simple: getting something done should not require looking at a screen, reaching for a keyboard or working through a menu. Say the sentence and let İva do the rest.',
    'İva şu anda prototip ve saha testi aşamasında. Avuç içi büyüklüğünde, ESP32-S3 tabanlı açık bir donanım üzerine kuruluyor; küçük ekranındaki yüz konuştukça değişiyor. Dilersen tüm veri kendi bilgisayarında kalabiliyor.':
      'İva is in prototype and field testing. It is palm sized, built on open ESP32-S3 based hardware, and the face on its little screen changes as it talks. If you prefer, all the data can stay on your own computer.',
    'Ürün hazır olduğunda — paketler, fiyatlar ve teslim koşulları belli olduğunda — ilk haber verilecek kişiler bu listedekiler olacak.':
      'When the product is ready — packages, prices and delivery terms settled — the people on this list hear first.',
    'haberdar ol': 'get notified',
    'E-posta adresini bırak, İva çıkınca ilk sen bil.': 'Leave your email and be the first to know when İva ships.',
    'katıl': 'join',
    'detay ekle': 'add a detail',
    'Satış yok, ön sipariş yok, ödeme yok — sadece haber. İstediğin an tek bir e-postayla listeden çıkabilirsin.':
      'No sales, no pre-orders, no payment — just news. One email takes you off the list whenever you like.',
    'Kurunda (hastane, poliklinik, AVM…) bir pilot uygulama denemek istersen': 'If you would like to try a pilot at your organisation (hospital, clinic, mall…)',
    'Kurumunda (hastane, poliklinik, AVM…) bir pilot uygulama denemek istersen': 'If you would like to try a pilot at your organisation (hospital, clinic, mall…)',
    'bize doğrudan yaz': 'write to us directly',
    'bir sorunuz mu var?': 'got a question?',
    'Bir sorunuz olursa lütfen iletişime geçmekten kaçınmayın — yazın, elimizden geldiğince hızlı dönüyoruz.':
      'If you have a question, please do not hesitate to get in touch — write to us and we will come back as fast as we can.',
    'gönder': 'send',
    'iva.nedir?': 'what is iva?',

    /* ── sekme başlıkları ── */
    'İva — Sesle Çalışan Türkçe Masaüstü Asistanı': 'İva — The Turkish-Speaking Voice Desk Assistant',
    'Bekleme Listesi — İva': 'Waitlist — İva',

    /* ── JS'in yazdığı metinler (data-tr ile çevriliyor) ── */
    /* NOT: 'sürükleyip çevir' ve 'bir parçaya tıkla' yukarıda, 3B bölümünde. */
    '3B model yüklenemedi.': 'The 3D model could not be loaded.',
    'Bağlantını kontrol edip sayfayı yenileyebilirsin.': 'Check your connection and reload the page.',
    'Ses açık — İva artık yüksek sesle konuşuyor.': 'Sound on — İva now speaks out loud.',
    'Ses kapatıldı.': 'Sound off.',
    'Durdum.': 'Stopped.',
    'Dinliyorum — "İva" diye seslen.': 'Listening — just call out "İva".',
    'Mikrofon kapatıldı.': 'Microphone off.',
    'Mikrofon izni verilmedi. Adres çubuğundaki kilitten açabilirsin.':
      'Microphone permission was denied. You can allow it from the lock icon in the address bar.',
    'Sesli komut için Chrome ya da Edge gerekiyor.': 'Voice commands need Chrome or Edge.',
    'Geçerli bir e-posta adresi yazar mısın?': 'Could you write a valid email address?',
    'Bir de mesajını yazar mısın?': 'Could you write your message as well?',
    'Gönderiliyor…': 'Sending…',
    'İva hazır olduğunda ilk sen haberdar olacaksın.': 'You will be the first to hear when İva is ready.',
    'Mesajın bize ulaştı. En kısa sürede döneceğiz.': 'Your message reached us. We will get back to you as soon as we can.',
    'Gönderemedim — e-posta uygulamanı açıyorum, mesaj hazır, göndermen yeterli. Açılmazsa şu adrese yazabilirsin:':
      'I could not send it — opening your email app with the message ready, you just need to hit send. If it does not open, write to:'
  };

  /* nitelikler: placeholder, aria-label, title, alt */
  var ATTR_EN = {
    'İva ana sayfa': 'İva home',
    'Aşağı kaydır': 'Scroll down',
    'Görünüm seçimi': 'View selection',
    'İva\'yı dene': 'Try İva',
    'Sesi aç': 'Turn sound on',
    'Sesi kapat': 'Turn sound off',
    'Mikrofonu aç': 'Turn the microphone on',
    'Mikrofonu kapat': 'Turn the microphone off',
    'Önceki': 'Previous',
    'Sonraki': 'Next',
    'E-posta adresin': 'Your email address',
    'Eklemek istediğin detay': 'Anything you want to add',
    'Sorunuz ya da mesajınız': 'Your question or message',
    'Sorunuz ya da mesajınız…': 'Your question or message…',
    'İstersen bir şey ekle: adın, nerede kullanmayı düşündüğün, merak ettiğin…':
      'Add anything you like: your name, where you would use it, what you are wondering about…',
    'İva masaüstü asistanı — 3B model': 'İva desk assistant — 3D model',
    'İva 3B ürün görünümü': 'İva 3D product view',
    'İva kontrol paneli ekran görüntüsü': 'İva control panel screenshot',
    'İva kontrol paneli — durum ekranı': 'İva control panel — status screen',

    /* senaryo görselleri */
    'Ders sırasında sıranın üzerinde duran İva; açık defter ve kalem kenarda duruyor':
      'İva on a desk during a lecture, an open notebook and pen beside it',
    'Toplantı bitiminde masada duran İva; dağılmış sandalyeler ve kapalı dizüstü bilgisayar':
      'İva on the table as a meeting ends, chairs pushed about and a closed laptop',
    'Çalışma masasında kitapların yanında duran İva, duvarda işaretli takvim':
      'İva next to books on a study desk, a marked calendar on the wall',
    'Sade bir ev ofisinde masanın ortasında duran İva; telefon ters çevrilmiş':
      'İva in the middle of a plain home-office desk, a phone turned face down',
    'Oturma odasında alçak masada duran İva ile konuşan bir kişi':
      'Someone talking to İva on a low table in a living room',
    'Poliklinik danışma bankosunda duran İva, arkada bulanık koridor':
      'İva on a clinic reception desk, a blurred corridor behind it',
    'Bekleme salonunda yan sehpada duran İva, boş koltuklar':
      'İva on a side table in a waiting area, empty seats around',
    'AVM koridorunda ince bir sütun üzerinde duran İva':
      'İva on a slim column in a shopping-mall walkway',
    'Mutfak masasında çay bardağının yanında duran İva ve yaşlı bir kişinin elleri':
      'İva beside a tea glass on a kitchen table, with an older person\'s hands'
  };

  // marka adı ve dil düğmesinin kendisi çevrilmez
  var SKIP = /^(iva|EN|TR)(\s+iva)*$/i;

  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  var lang = 'tr';
  var snapshot = null;                              // ilk (Türkçe) hâli burada saklanıyor

  function collect(){
    var texts = [], attrs = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        if (!norm(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode, tag = p && p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        // data-tr taşıyan kutuların içini JS yazıyor; anlık görüntüsünü
        // saklarsak sonraki apply() eski metni geri yazıyor.
        if (p.closest && p.closest('[data-tr]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) texts.push({ node: n, tr: n.nodeValue });
    var all = document.body.querySelectorAll('[placeholder],[aria-label],[title],[alt]');
    Array.prototype.forEach.call(all, function(el){
      ATTRS.forEach(function(a){
        if (el.hasAttribute(a)) attrs.push({ el: el, attr: a, tr: el.getAttribute(a) });
      });
    });
    return { texts: texts, attrs: attrs, title: document.title };
  }

  function apply(to){
    if (!snapshot) snapshot = collect();
    snapshot.texts.forEach(function(t){
      var key = norm(t.tr);
      var en = EN[key];
      // Anahtar normalize edilmiş metin; ham düğümde satır kırığı varsa onu
      // olduğu gibi aramak (eski hâli) sessizce başarısız oluyordu. Baştaki ve
      // sondaki boşluğu koruyup gövdeyi değiştiriyoruz.
      if (to === 'en' && en){
        var lead = t.tr.match(/^\s*/)[0], tail = t.tr.match(/\s*$/)[0];
        t.node.nodeValue = lead + en + tail;
      } else {
        t.node.nodeValue = t.tr;
      }
    });
    snapshot.attrs.forEach(function(a){
      var en = ATTR_EN[norm(a.tr)] || EN[norm(a.tr)];
      a.el.setAttribute(a.attr, (to === 'en' && en) ? en : a.tr);
    });
    // JS'in yazdığı metinler: kaynak Türkçesi data-tr'de durur, dil değişince
    // buradan yeniden çevrilir (sayfa yüklendikten sonra değişen ipuçları,
    // form mesajları…).
    Array.prototype.forEach.call(document.querySelectorAll('[data-tr]'), function(el){
      var s = el.getAttribute('data-tr'), en = EN[norm(s)];
      el.textContent = ((to === 'en' && en) ? en : s) + (el.getAttribute('data-tr-add') || '');
    });
    // sekme başlığı da dili takip etsin
    var tEn = EN[norm(snapshot.title)];
    document.title = (to === 'en' && tEn) ? tEn : snapshot.title;
    document.documentElement.setAttribute('lang', to);
    lang = to;
    var btn = document.getElementById('btnLang');
    if (btn){
      btn.textContent = to === 'en' ? 'TR' : 'EN';
      btn.setAttribute('aria-label', to === 'en' ? 'Türkçeye geç' : 'Switch to English');
      btn.title = btn.getAttribute('aria-label');
    }
    try { localStorage.setItem(KEY, to); } catch (e) {}
  }

  function init(){
    var btn = document.getElementById('btnLang');
    var saved = 'tr';
    try { saved = localStorage.getItem(KEY) === 'en' ? 'en' : 'tr'; } catch (e) {}
    if (btn) btn.addEventListener('click', function(){ apply(lang === 'en' ? 'tr' : 'en'); });
    apply(saved);
  }

  // sayfadaki JS üretimi içerik (kartlar, düğmeler) kurulduktan sonra çalış
  if (document.readyState === 'complete') setTimeout(init, 0);
  else window.addEventListener('load', function(){ setTimeout(init, 0); });

  /** JS ile sonradan eklenen düğümleri sözlüğe dahil et ve dili yeniden uygula */
  function refresh(){
    if (!snapshot){ apply(lang); return; }
    var known = snapshot.texts.map(function(t){ return t.node; });
    var fresh = collect();
    fresh.texts.forEach(function(t){
      if (known.indexOf(t.node) === -1) snapshot.texts.push(t);
    });
    fresh.attrs.forEach(function(a){
      for (var i = 0; i < snapshot.attrs.length; i++){
        if (snapshot.attrs[i].el === a.el && snapshot.attrs[i].attr === a.attr) return;
      }
      snapshot.attrs.push(a);
    });
    apply(lang);
  }

  /** JS'in ürettiği bir Türkçe metni geçerli dile çevirir */
  function t(s){ var en = EN[norm(s)]; return (lang === 'en' && en) ? en : s; }

  /**
   * Metni yaz ve kaynağını sakla, böylece dil değişince yeniden çevrilir.
   * `extra`, çeviriden sonra olduğu gibi eklenir (e-posta adresi gibi
   * çevrilmeyen parçalar için).
   */
  function put(el, s, extra){
    if (!el) return;
    el.setAttribute('data-tr', s);
    if (extra) el.setAttribute('data-tr-add', extra);
    else el.removeAttribute('data-tr-add');
    el.textContent = t(s) + (extra || '');
  }

  window.IvaLang = {
    now: function(){ return lang; },
    set: apply,
    refresh: refresh,
    t: t,
    put: put,
    /** çevrilmeden kalan metinleri döker — kapsama kontrolü için */
    missing: function(){
      if (!snapshot) snapshot = collect();
      var out = [];
      snapshot.texts.forEach(function(t){
        var k = norm(t.tr);
        if (EN[k] || SKIP.test(k)) return;
        if (/[a-zçğıöşü]/i.test(k) && !/^[\s\d.,:·—→‹›✓✕+…]+$/.test(k)) out.push(k);
      });
      return out;
    }
  };
})();
