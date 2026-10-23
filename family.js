/* Frases de la familia y del visitante según el país de quien juega.
 * Edita aquí sin tocar el motor del juego.
 * - t: la frase tal cual (en el idioma del país)
 * - es: traducción al español (solo cuando el idioma no es español)
 */
window.HALLACA_DATA = {
  MAMI: [
    '¡Ven acá, mi amor! Un abrazo bien apretao. ¡Cómo te extrañaba!',
    'Te guardé una arepita con queso. Cómetela calientica.',
    'Aunque estés lejos, en esta mesa siempre hay un puesto pa\' ti.',
    'Llámame más seguido, ¿sí? La casa no es igual sin ti.',
    'Mírate, qué grande y qué bonit@. Estoy orgullosa de ti.',
    'Toma tu arepita, que de seguro allá no te alimentas bien.',
  ],
  PAPI: [
    'Ven, dame un abrazo. Qué orgullo verte, mi cielo.',
    'Toma esta arepita, la hice como te gusta: tostadita.',
    'Cada diciembre pongo tu silla en la mesa, por si acaso.',
    'La distancia es larga, pero el cariño llega igualito.',
    'Cuando vuelvas a casa, la gaita va a sonar más bonito.',
    'No importa dónde estés: esta siempre va a ser tu casa.',
  ],
  KIDS: [
    '¡Tú la llevas! ¡Corre, corre!',
    '¡Primo, ven a jugar metras!',
    '¿Me regalas un tequeño? Porfa, porfa.',
    '¡Mira lo que me trajo el Niño Jesús!',
    '¡Uno, dos, tres por ti! ¡Te encontré!',
    '¡Juguemos escondite! Tú cuentas.',
    '¡Te gané la carrera! ¡Otra, otra!',
  ],
  KID_NAMES: ['Santi', 'Valen', 'Mateo', 'Sofi', 'Thiago', 'Isa', 'Benja', 'Emma', 'Nico', 'Lucía'],

  // Un familiar de visita según el país que escogió la persona.
  COUNTRY: {
    'Venezuela': { name: 'Pana Wilmer', lines: [{ t: '¡Epa, chamo! Esa hallaca va a quedar burda de buena.' }, { t: '¡Qué ladilla! Se acabó el papelón y nadie avisó.' }] },
    'Colombia': { name: 'Tía Marleny', lines: [{ t: '¡Quiubo, mijo! ¿Ya rezó la novena? Hay natilla y buñuelos.' }, { t: '¡Qué chimba de hallaca, parce! Parece tamal, pero no le diga.' }] },
    'Chile': { name: 'Tío Pato', lines: [{ t: '¡Wena, po! ¿Cachai que esto es como un pan de pascua salado?' }, { t: '¿Te tinca un cola de mono? Al tiro te sirvo, po.' }] },
    'Argentina': { name: 'Tío Rulo', lines: [{ t: '¡Che, qué copado! ¿Esto va con vitel toné?' }, { t: 'Dale, que a las doce se brinda con sidra, ¿eh?' }] },
    'Perú': { name: 'Tía Charo', lines: [{ t: '¡Habla, causa! ¿Y el panetón con chocolatito caliente?' }, { t: '¡Qué bacán! Está más rica que un tamalito.' }] },
    'Ecuador': { name: 'Ñaño Lucho', lines: [{ t: '¡Qué bestia, ñaño! ¿Y los pristiños con miel?' }, { t: '¡Achachay, qué frío! Pásame un chocolatito.' }] },
    'México': { name: 'Tío Lupe', lines: [{ t: '¡Órale, qué padre! ¿Y los tamales y el ponche?' }, { t: '¡No manches! Sin piñata no hay posada.' }] },
    'Panamá': { name: 'Tío Fren', lines: [{ t: '¡Xopá, fren! Esa vaina está chévere.' }, { t: '¿Y el arroz con guandú pa\' la cena?' }] },
    'República Dominicana': { name: 'Tía Yari', lines: [{ t: '¡Klk, mi amor! ¿Y el moro de guandules?' }, { t: '¡Diache, qué rico! Esto sabe a Nochebuena.' }] },
    'Costa Rica': { name: 'Mae Andrés', lines: [{ t: '¡Pura vida, mae! ¿Y los tamales de la abuela?' }, { t: '¡Qué tuanis! Más rico que el rompope.' }] },
    'Uruguay': { name: 'Tío Beto', lines: [{ t: '¡Ta, bo! ¿Y el mate pa\' la Nochebuena?' }, { t: 'A las doce tiramos fuegos en la rambla, ¿venís?' }] },
    'Bolivia': { name: 'Tía Rosa', lines: [{ t: '¡Ya pues, hermano! ¿Ya está la picana?' }, { t: 'Después de la misa de gallo, picana calientita.' }] },
    'Paraguay': { name: 'Tío Kike', lines: [{ t: '¡Che ra\'a! ¿Y el clericó pa\' brindar?' }, { t: '¡Ndeee, qué rico! Falta la sopa paraguaya.' }] },
    'Guatemala': { name: 'Tía Chepita', lines: [{ t: '¡Qué chilero, vos! ¿Y los tamales colorados?' }, { t: 'A las doce, cohetes y ponche de frutas.' }] },
    'Honduras': { name: 'Tío Chema', lines: [{ t: '¡Qué macizo, maje! ¿Y los nacatamales?' }, { t: '¡Púchica! Ya mero son las doce.' }] },
    'El Salvador': { name: 'Tía Neta', lines: [{ t: '¡Qué chivo, cipote! ¿Y el pan con pavo?' }, { t: 'A las doce, cohetes y abrazos, ¿va?' }] },
    'Nicaragua': { name: 'Tío Chele', lines: [{ t: '¡Qué tuanis, chavalo! ¿Ya fuiste a la Gritería?' }, { t: '¡Dale pues! Pasame el nacatamal.' }] },
    'Cuba': { name: 'Tío Pepito', lines: [{ t: '¡Asere, qué bolá! ¿Y el lechón asado?' }, { t: 'Esto está más rico que el congrí de mi abuela.' }] },
    'Puerto Rico': { name: 'Titi Carmen', lines: [{ t: '¡Wepa! ¿Y el coquito y los pasteles?' }, { t: 'Esto pide parranda hasta el Día de Reyes.' }] },
    'España': { name: 'Tío Paco', lines: [{ t: '¡Venga, qué guay! ¿Y el turrón y el roscón?' }, { t: '¡Ostras! Esto está de rechupete.' }] },
    'Estados Unidos': { name: 'Uncle Bob', lines: [{ t: 'Merry Christmas! Can I put cranberry sauce on it?', es: '¡Feliz Navidad! ¿Le puedo poner salsa de arándanos?' }, { t: 'Is this like a tamale? Looks awesome!', es: '¿Es como un tamal? ¡Se ve increíble!' }] },
    'Canadá': { name: 'Oncle Luc', lines: [{ t: 'Joyeux Noël! Ça se mange avec du sirop d\'érable?', es: '¡Feliz Navidad! ¿Se come con sirope de arce?' }, { t: 'Merry Christmas, eh! Let it snow!', es: '¡Feliz Navidad! ¡Que nieve!' }] },
    'Portugal': { name: 'Tio Zé', lines: [{ t: 'Feliz Natal! Isto leva bacalhau?', es: '¡Feliz Navidad! ¿Esto lleva bacalao?' }, { t: 'Boas Festas! Onde está o bolo-rei?', es: '¡Felices fiestas! ¿Dónde está el bolo-rei?' }] },
    'Brasil': { name: 'Tia Cida', lines: [{ t: 'Feliz Natal! Cadê o panetone e o pavê?', es: '¡Feliz Navidad! ¿Dónde están el panetón y el pavê?' }, { t: 'Que delícia! Parece pamonha de Natal!', es: '¡Qué rico! ¡Parece una pamonha navideña!' }] },
    'Italia': { name: 'Zio Gino', lines: [{ t: 'Buon Natale! Ci vuole un po\' di panettone!', es: '¡Feliz Navidad! ¡Hace falta un poco de panettone!' }, { t: 'Mamma mia, che buono!', es: '¡Mamma mia, qué rico!' }] },
    'Alemania': { name: 'Onkel Klaus', lines: [{ t: 'Frohe Weihnachten! Passt das zum Glühwein?', es: '¡Feliz Navidad! ¿Esto va con vino caliente?' }, { t: 'Lecker! Fast so gut wie Stollen.', es: '¡Rico! Casi tan bueno como el stollen.' }] },
    'Francia': { name: 'Tonton Pierre', lines: [{ t: 'Joyeux Noël ! Et la bûche de Noël ?', es: '¡Feliz Navidad! ¿Y el tronco de Navidad?' }, { t: 'Oh là là, c\'est délicieux !', es: '¡Oh là là, está delicioso!' }] },
    'Reino Unido': { name: 'Uncle Nigel', lines: [{ t: 'Happy Christmas! Fancy a mince pie with that?', es: '¡Feliz Navidad! ¿Te provoca un mince pie con eso?' }, { t: 'Brilliant! Better than Christmas pudding!', es: '¡Genial! ¡Mejor que el pudín de Navidad!' }] },
    'Países Bajos': { name: 'Oom Henk', lines: [{ t: 'Vrolijk kerstfeest! Gaan we gourmetten?', es: '¡Feliz Navidad! ¿Hacemos gourmetten? (tradición neerlandesa)' }, { t: 'Lekker, hoor!', es: '¡Qué rico!' }] },
    'China': { name: 'Tío Wei', lines: [{ t: '平安夜快乐！送你一个平安果。', es: '¡Feliz Nochebuena! Te regalo una "manzana de la paz", tradición en China.' }, { t: '圣诞快乐！', es: '¡Feliz Navidad! (Shèngdàn kuàilè)' }] },
    'Japón': { name: 'Tía Yuki', lines: [{ t: 'メリークリスマス！ケーキ食べた？', es: '¡Feliz Navidad! ¿Ya comiste pastel? (en Japón se come torta de fresas)' }, { t: 'おいしい！', es: '¡Qué rico! (Oishii)' }] },
    'Corea del Sur': { name: 'Tío Min-ho', lines: [{ t: '메리 크리스마스!', es: '¡Feliz Navidad! (Meri keuriseumaseu)' }, { t: '맛있어요!', es: '¡Está delicioso! (Masisseoyo)' }] },
    'Otro': { name: 'Tía Viajera', lines: [{ t: '¡Feliz Navidad desde donde estés! La hallaca une al mundo.' }, { t: '¡Crucé medio planeta solo por una hallaca!' }] },
  },
};

// Todos los países y territorios (ISO 3166-1). Los nombres en español los pone el navegador (Intl.DisplayNames).
window.HALLACA_REGIONS = {
  top: 'VE CO CL AR PE EC MX ES US PA DO CR UY BO PY GT HN SV NI CU PR'.split(' '),
  all: ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ ' +
    'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
    'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT ' +
    'MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
    'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG ' +
    'UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW').split(' '),
};

// Para los países sin familiar propio: el visitante saluda en el idioma principal del país.
window.HALLACA_LANGS = {
  en: { name: 'Uncle Joe', t: 'Merry Christmas!', es: '¡Feliz Navidad!' },
  fr: { name: 'Tonton Marc', t: 'Joyeux Noël !', es: '¡Feliz Navidad!' },
  pt: { name: 'Tio Zé', t: 'Feliz Natal!', es: '¡Feliz Navidad!' },
  it: { name: 'Zio Gino', t: 'Buon Natale!', es: '¡Feliz Navidad!' },
  de: { name: 'Onkel Klaus', t: 'Frohe Weihnachten!', es: '¡Feliz Navidad!' },
  nl: { name: 'Oom Henk', t: 'Vrolijk kerstfeest!', es: '¡Feliz Navidad!' },
  sv: { name: 'Morbror Lars', t: 'God jul!', es: '¡Feliz Navidad!' },
  nb: { name: 'Onkel Ole', t: 'God jul!', es: '¡Feliz Navidad!' },
  da: { name: 'Onkel Søren', t: 'Glædelig jul!', es: '¡Feliz Navidad!' },
  fi: { name: 'Setä Mikko', t: 'Hyvää joulua!', es: '¡Feliz Navidad!' },
  is: { name: 'Frændi Jón', t: 'Gleðileg jól!', es: '¡Feliz Navidad!' },
  pl: { name: 'Wujek Jan', t: 'Wesołych Świąt!', es: '¡Felices fiestas!' },
  cs: { name: 'Strýc Petr', t: 'Veselé Vánoce!', es: '¡Feliz Navidad!' },
  sk: { name: 'Strýko Juraj', t: 'Veselé Vianoce!', es: '¡Feliz Navidad!' },
  hu: { name: 'Laci bácsi', t: 'Boldog karácsonyt!', es: '¡Feliz Navidad!' },
  ro: { name: 'Unchiul Ion', t: 'Crăciun fericit!', es: '¡Feliz Navidad!' },
  bg: { name: 'Chicho Ivan', t: 'Весела Коледа!', es: '¡Feliz Navidad! (Vesela Koleda)' },
  sr: { name: 'Čika Marko', t: 'Srećan Božić!', es: '¡Feliz Navidad!' },
  hr: { name: 'Stric Ivo', t: 'Sretan Božić!', es: '¡Feliz Navidad!' },
  sl: { name: 'Stric Janez', t: 'Vesel božič!', es: '¡Feliz Navidad!' },
  mk: { name: 'Čičko Goce', t: 'Среќен Божиќ!', es: '¡Feliz Navidad! (Srekjen Božikj)' },
  sq: { name: 'Xhaxhi Artan', t: 'Gëzuar Krishtlindjet!', es: '¡Feliz Navidad!' },
  el: { name: 'Theíos Nikos', t: 'Καλά Χριστούγεννα!', es: '¡Feliz Navidad! (Kalá Christoúgenna)' },
  ru: { name: 'Dyadya Misha', t: 'С Рождеством!', es: '¡Feliz Navidad! (S Rozhdestvom)' },
  uk: { name: 'Dyadko Taras', t: 'Веселого Різдва!', es: '¡Feliz Navidad! (Veseloho Rizdva)' },
  lt: { name: 'Dėdė Jonas', t: 'Linksmų Kalėdų!', es: '¡Feliz Navidad!' },
  lv: { name: 'Tēvocis Jānis', t: 'Priecīgus Ziemassvētkus!', es: '¡Feliz Navidad!' },
  et: { name: 'Onu Jaan', t: 'Häid jõule!', es: '¡Feliz Navidad!' },
  tr: { name: 'Amca Mehmet', t: 'Mutlu Noeller!', es: '¡Feliz Navidad!' },
  ar: { name: 'Ammo Karim', t: 'عيد ميلاد مجيد!', es: '¡Feliz Navidad! (Eid milad majid)' },
  he: { name: 'Dod Avi', t: 'חג מולד שמח!', es: '¡Feliz Navidad! (Jag molad saméaj)' },
  fa: { name: 'Amu Reza', t: 'کریسمس مبارک!', es: '¡Feliz Navidad! (Krismas mobārak)' },
  hi: { name: 'Chacha Raj', t: 'क्रिसमस की शुभकामनाएँ!', es: '¡Feliz Navidad! (Krismas ki shubhkamnayen)' },
  bn: { name: 'Kaka Rahim', t: 'শুভ বড়দিন!', es: '¡Feliz Navidad! (Shubho Boṛodin)' },
  ur: { name: 'Chacha Imran', t: 'کرسمس مبارک!', es: '¡Feliz Navidad! (Krismas mubarak)' },
  zh: { name: 'Tío Wei', t: '圣诞快乐！', es: '¡Feliz Navidad! (Shèngdàn kuàilè)' },
  ja: { name: 'Tía Yuki', t: 'メリークリスマス！', es: '¡Feliz Navidad! (Merī Kurisumasu)' },
  ko: { name: 'Tío Min-ho', t: '메리 크리스마스!', es: '¡Feliz Navidad! (Meri keuriseumaseu)' },
  vi: { name: 'Chú Minh', t: 'Giáng sinh vui vẻ!', es: '¡Feliz Navidad!' },
  th: { name: 'Lung Somchai', t: 'สุขสันต์วันคริสต์มาส!', es: '¡Feliz Navidad! (Suk san wan Christmas)' },
  id: { name: 'Om Budi', t: 'Selamat Natal!', es: '¡Feliz Navidad!' },
  ms: { name: 'Pak Cik Ali', t: 'Selamat Hari Krismas!', es: '¡Feliz Navidad!' },
  tl: { name: 'Tito Jun', t: 'Maligayang Pasko!', es: '¡Feliz Navidad!' },
  sw: { name: 'Mjomba Juma', t: 'Krismasi Njema!', es: '¡Feliz Navidad!' },
  am: { name: 'Agote Abebe', t: 'መልካም ገና!', es: '¡Feliz Navidad! (Melkam Gena)' },
  af: { name: 'Oom Piet', t: 'Geseënde Kersfees!', es: '¡Feliz Navidad!' },
  ka: { name: 'Bidza Giorgi', t: 'გილოცავთ შობას!', es: '¡Feliz Navidad! (Gilotsavt shobas)' },
  hy: { name: 'Keri Aram', t: 'Շնորհավոր Սուրբ Ծնունդ!', es: '¡Feliz Navidad! (Shnorhavor Surb Tsnund)' },
  ht: { name: 'Tonton Jak', t: 'Jwaye Nwèl!', es: '¡Feliz Navidad!' },
  mt: { name: 'Ziju Ġorġ', t: 'Il-Milied it-Tajjeb!', es: '¡Feliz Navidad!' },
  ca: { name: 'Oncle Jordi', t: 'Bon Nadal!', es: '¡Feliz Navidad!' },
  es: { name: 'Tía Viajera', t: '¡Feliz Navidad!' },
};
window.HALLACA_COUNTRY_LANG = (function () {
  const by = {
    en: 'US GB IE AU NZ JM TT BS BB BZ GY AG DM GD KN LC VC NG GH UG ZM ZW BW LR SL GM MW PG FJ SB KI TV NR MH FM PW WS TO SG SS LS SZ MU SC ER LK MV AI BM KY TC VG VI GU AS MP GI FK SH PN NF CK NU TK IM JE GG CX CC IO MS',
    fr: 'FR BE LU MC CD CG CI SN ML BF NE TD CF GA GN BJ TG MG CM DJ KM BI RW NC PF WF PM RE YT GP MQ GF BL MF VU TF',
    pt: 'PT BR AO MZ CV GW ST TL', it: 'IT SM VA', de: 'DE AT LI CH', nl: 'NL SR AW CW SX BQ',
    sv: 'SE AX', nb: 'NO SJ BV', da: 'DK GL FO', fi: 'FI', is: 'IS', pl: 'PL', cs: 'CZ', sk: 'SK', hu: 'HU',
    ro: 'RO MD', bg: 'BG', sr: 'RS ME', hr: 'HR BA', sl: 'SI', sq: 'AL XK', mk: 'MK', el: 'GR CY', ru: 'RU BY KZ KG',
    uk: 'UA', lt: 'LT', lv: 'LV', et: 'EE', tr: 'TR',
    ar: 'SA AE QA KW BH OM YE IQ SY JO LB PS EG LY TN DZ MA SD MR EH SO', he: 'IL', fa: 'IR AF', hi: 'IN',
    bn: 'BD', ur: 'PK', zh: 'CN TW HK MO', ja: 'JP', ko: 'KR KP', vi: 'VN', th: 'TH', id: 'ID', ms: 'MY BN',
    tl: 'PH', sw: 'KE TZ', am: 'ET', af: 'ZA NA', ka: 'GE', hy: 'AM', ht: 'HT', mt: 'MT', ca: 'AD', es: 'GQ',
  };
  const out = {};
  for (const l in by) by[l].split(' ').forEach((c) => { out[c] = l; });
  return out;
})();
