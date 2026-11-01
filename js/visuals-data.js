/* Наглядные материалы: фотографии объектов культуры и авторские карты-схемы. */
// Изображения хранятся локально в assets/visuals; ссылки на источники — в VISUAL_SOURCES.
'use strict';

const VISUAL_PHOTOS = {
  'sophia-kiev': {
    title: 'Софийский собор в Киеве',
    meta: 'XI в. · Древняя Русь',
    caption: 'Построен при Ярославе Мудром. Узнавайте многокупольный силуэт; не путайте с Софией Новгородской.'
  },
  'sophia-novgorod': {
    title: 'Софийский собор в Новгороде',
    meta: 'XI в. · Новгородская земля',
    caption: 'Главный храм Новгородской земли. Сравнивайте с киевской Софией по силуэту и расположению.'
  },
  'uspensky-vladimir': {
    title: 'Успенский собор во Владимире',
    meta: 'XII в. · Владимиро-Суздальская Русь',
    caption: 'Связан с Андреем Боголюбским и Всеволодом Большое Гнездо. Один из главных храмов домонгольской Руси.'
  },
  'pokrova-nerli': {
    title: 'Церковь Покрова на Нерли',
    meta: 'XII в. · Владимиро-Суздальская Русь',
    caption: 'Образец белокаменного зодчества при Андрее Боголюбском. Часто встречается в заданиях по культуре.'
  },
  'trinity-rublev': {
    title: '«Троица» Андрея Рублёва',
    meta: 'XV в. · древнерусская живопись',
    caption: 'Главный образ древнерусской иконописи. Не путайте Рублёва с Феофаном Греком.'
  },
  'moscow-kremlin': {
    title: 'Московский Кремль',
    meta: 'XV–XVI вв. · Московское царство',
    caption: 'Белокаменные стены Дмитрия Донского, затем краснокирпичные стены Ивана III. Узнавайте башни и соборную площадь.'
  },
  'saint-basil': {
    title: 'Храм Василия Блаженного',
    meta: 'XVI в. · русское узорочье',
    caption: 'Построен при Иване Грозном в честь взятия Казани. Не путайте с кремлёвскими соборами.'
  },
  'novodevichy': {
    title: 'Новодевичий монастырь',
    meta: 'XVI в. · Московское царство',
    caption: 'Основан при Василии III. Связан со Смутой и царской семьёй; узнавайте стены и башни.'
  },
  'winter-palace': {
    title: 'Зимний дворец',
    meta: 'XVIII в. · елизаветинское барокко',
    caption: 'Растрелли. Узнавайте пышный фасад и барочный декор; не относите к классицизму.'
  },
  'pashkov-house': {
    title: 'Дом Пашкова',
    meta: 'XVIII в. · классицизм',
    caption: 'Московский классицизм Баженова. Сравнивайте с барочным Зимним дворцом.'
  },
  'bronze-horseman': {
    title: '«Медный всадник»',
    meta: 'XVIII в. · классицизм',
    caption: 'Памятник Петру I работы Фальконе. Связка: Пётр I → Петербург → «Медный всадник».'
  },
  'bolshoi-theatre': {
    title: 'Большой театр',
    meta: 'XIX в. · ампир и классицизм',
    caption: 'Здание по проекту Бове. В заданиях важно связать театр с Москвой и XIX веком.'
  },
  'isaac-cathedral': {
    title: 'Исаакиевский собор',
    meta: 'XIX в. · ампир',
    caption: 'Собор Монферрана в Петербурге. Узнавайте по большому куполу и колоннаде.'
  },
  'christ-saviour': {
    title: 'Храм Христа Спасителя',
    meta: 'XIX в. · русско-византийский стиль',
    caption: 'Памятник победе 1812 года; восстановлен в 1990-е. Связка: 1812 → храм-памятник.'
  },
  'kazan-cathedral': {
    title: 'Казанский собор',
    meta: 'XIX в. · ампир',
    caption: 'Собор Воронихина в Петербурге связан с войной 1812 года и Кутузовым.'
  },
  'minin-pozharsky': {
    title: 'Памятник Минину и Пожарскому',
    meta: 'XIX в. · память о Смуте',
    caption: 'Скульптура Мартоса на Красной площади посвящена событиям 1612 года.'
  },
  'mariinsky': {
    title: 'Мариинский театр',
    meta: 'XIX в. · музыкальная культура',
    caption: 'Центр оперы и балета в Петербурге. Связка: Чайковский, балет, XIX век.'
  },
  'conservatory': {
    title: 'Московская консерватория',
    meta: 'XIX в. · музыкальное образование',
    caption: 'Основана в 1866 году. Связка: Чайковский, Рубинштейн, музыкальная культура.'
  },
  'last-day-pompeii': {
    title: '«Последний день Помпеи»',
    meta: '1830–1833 · академическая живопись',
    caption: 'Карл Брюллов. Соединение классицизма и романтизма; спрашивают автора и сюжет.'
  },
  'appearance-christ': {
    title: '«Явление Христа народу»',
    meta: '1837–1857 · академическая живопись',
    caption: 'Александр Иванов. Работа над картиной шла десятилетиями; узнавайте многофигурную композицию.'
  },
  'barge-haulers': {
    title: '«Бурлаки на Волге»',
    meta: '1870–1873 · реализм',
    caption: 'Илья Репин. Социальный реализм и образ тяжёлого труда; связка с передвижниками.'
  },
  'morning-execution': {
    title: '«Утро стрелецкой казни»',
    meta: '1881 · историческая живопись',
    caption: 'Василий Суриков. Сюжет — стрелецкий бунт 1698 года при Петре I.'
  },
  'red-horse': {
    title: '«Купание красного коня»',
    meta: '1912 · символизм и авангард',
    caption: 'Кузьма Петров-Водкин. Узнаваемый образ Серебряного века.'
  },
  'black-square': {
    title: '«Чёрный квадрат»',
    meta: '1915 · авангард',
    caption: 'Казимир Малевич. Символ супрематизма; не относите к передвижникам.'
  },
  'lenin-mausoleum': {
    title: 'Мавзолей Ленина',
    meta: '1920–1930-е · советская архитектура',
    caption: 'Мавзолей на Красной площади (Щусев). Связка: 1924 → память о Ленине.'
  },
  'melnikov-house': {
    title: 'Дом Мельникова',
    meta: '1920-е · конструктивизм',
    caption: 'Эксперимент советского авангарда. Узнавайте необычный цилиндрический объём.'
  },
  'shukhov-tower': {
    title: 'Шуховская башня',
    meta: '1920-е · инженерный авангард',
    caption: 'Гиперболоидная конструкция. Пример технической мысли, а не жилой архитектуры.'
  },
  'worker-kolkhoz': {
    title: '«Рабочий и колхозница»',
    meta: '1937 · соцреализм',
    caption: 'Монумент Мухиной. Символ союза рабочего класса и крестьянства.'
  },
  'msu': {
    title: 'Главное здание МГУ',
    meta: '1950-е · сталинский ампир',
    caption: 'Здание на Воробьёвых горах — символ послевоенного строительства.'
  },
  'vdnh': {
    title: 'ВДНХ',
    meta: '1930–1950-е · советская монументальность',
    caption: 'Выставка достижений народного хозяйства. Павильоны и монументы как витрина СССР.'
  },
  'ostankino-tower': {
    title: 'Останкинская телебашня',
    meta: '1960-е · советский модернизм',
    caption: 'Символ научно-технического развития СССР 1960-х годов.'
  },
  'motherland': {
    title: '«Родина-мать зовёт!»',
    meta: '1967 · мемориал',
    caption: 'Мемориал на Мамаевом кургане. Связка: Сталинградская битва → память о войне.'
  }
};

const VISUAL_SOURCES = {
  'sophia-kiev': "https://commons.wikimedia.org/wiki/File:80-391-0151_Kyiv_St.Sophia's_Cathedral_RB_18_2_(cropped).jpg",
  'sophia-novgorod': "https://commons.wikimedia.org/wiki/File:Saint_Sophia_Cathedral_in_Novgorod_pic1.JPG",
  'uspensky-vladimir': "https://commons.wikimedia.org/wiki/File:%D0%A3%D1%81%D0%BF%D0%B5%D0%BD%D1%81%D0%BA%D0%B8%D0%B9_%D1%81%D0%BE%D0%B1%D0%BE%D1%80_%D0%B2%D0%BE_%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80%D0%B5.jpg",
  'pokrova-nerli': "https://commons.wikimedia.org/wiki/File:Bogolyubovo_asv2019-01_img02_Intercession_Church.jpg",
  'trinity-rublev': "https://commons.wikimedia.org/wiki/File:Andrey_Rublev_-_%D0%A1%D0%B2._%D0%A2%D1%80%D0%BE%D0%B8%D1%86%D0%B0_-_Google_Art_Project.jpg",
  'moscow-kremlin': "https://commons.wikimedia.org/wiki/File:%D0%9C%D0%BE%D1%81%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B8%D0%B9_%D0%BA%D1%80%D0%B5%D0%BC%D0%BB%D1%8C_%D0%BD%D0%B0_%D0%B7%D0%B0%D0%BA%D0%B0%D1%82%D0%B5.jpg",
  'saint-basil': "https://commons.wikimedia.org/wiki/File:Saint_Basil's_Cathedral_in_Moscow.jpg",
  'novodevichy': "https://commons.wikimedia.org/wiki/File:2024_Novodevichy_Convent_in_Moscow.jpg",
  'winter-palace': "https://commons.wikimedia.org/wiki/File:%D0%97%D0%B8%D0%BC%D0%BD%D0%B8%D0%B9_%D0%B4%D0%B2%D0%BE%D1%80%D0%B5%D1%86_%D0%BE%D1%81%D0%B5%D0%BD%D1%8C%D1%8E.jpg",
  'pashkov-house': "https://commons.wikimedia.org/wiki/File:Casa_Pashkov%2C_Mosc%C3%BA%2C_Rusia%2C_2016-10-03%2C_DD_36-37_HDR.jpg",
  'bronze-horseman': "https://commons.wikimedia.org/wiki/File:The_Bronze_Horseman_(St._Petersburg%2C_Russia).jpg",
  'bolshoi-theatre': "https://commons.wikimedia.org/wiki/File:Bolshoi_Theatre.jpg",
  'isaac-cathedral': "https://commons.wikimedia.org/wiki/File:Saint_Isaac's_Cathedral_in_SPB.jpeg",
  'christ-saviour': "https://commons.wikimedia.org/wiki/File:Cathedral_of_Christ_the_Saviour_-_Moscow_2024-8.jpg",
  'kazan-cathedral': "https://commons.wikimedia.org/wiki/File:Kazan_Cathedral_Saint_Petersburg.jpg",
  'minin-pozharsky': "https://commons.wikimedia.org/wiki/File:0340_-_Moskau_2015_(26399133935).jpg",
  'mariinsky': "https://commons.wikimedia.org/wiki/File:Mariinsky_Theatre.jpg",
  'conservatory': "https://commons.wikimedia.org/wiki/File:Moscow_05-2017_img41_Conservatory.jpg",
  'last-day-pompeii': "https://commons.wikimedia.org/wiki/File:Karl_Brullov_-_The_Last_Day_of_Pompeii_-_Google_Art_Project.jpg",
  'appearance-christ': "https://commons.wikimedia.org/wiki/File:%D0%90%D0%BB%D0%B5%D0%BA%D1%81%D0%B0%D0%BD%D0%B4%D1%80_%D0%90%D0%BD%D0%B4%D1%80%D0%B5%D0%B5%D0%B2%D0%B8%D1%87_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2_-_%D0%AF%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5_%D0%A5%D1%80%D0%B8%D1%81%D1%82%D0%B0_%D0%BD%D0%B0%D1%80%D0%BE%D0%B4%D1%83_(%D0%AF%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5_%D0%9C%D0%B5%D1%81%D1%81%D0%B8%D0%B8)_-_Google_Art_Project.jpg",
  'barge-haulers': "https://commons.wikimedia.org/wiki/File:Ilya_Repin_-_Barge_Haulers_on_the_Volga_-_Google_Art_Project.jpg",
  'morning-execution': "https://commons.wikimedia.org/wiki/File:Surikov_streltsi.jpg",
  'red-horse': "https://commons.wikimedia.org/wiki/File:Bathing_of_a_Red_Horse_(Petrov-Vodkin).jpg",
  'black-square': "https://commons.wikimedia.org/wiki/File:%D0%A7%D1%91%D1%80%D0%BD%D1%8B%D0%B9_%D1%81%D1%83%D0%BF%D1%80%D0%B5%D0%BC%D0%B0%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9_%D0%BA%D0%B2%D0%B0%D0%B4%D1%80%D0%B0%D1%82._1915._%D0%93%D0%A2%D0%93.png",
  'lenin-mausoleum': "https://commons.wikimedia.org/wiki/File:Mauzoleumlenina_(cropped).jpeg",
  'melnikov-house': "https://commons.wikimedia.org/wiki/File:Melnikov_House%2C_May_2021.jpg",
  'shukhov-tower': "https://commons.wikimedia.org/wiki/File:%D0%97%D0%B0%D0%BA%D0%B0%D1%82_%D0%BD%D0%B0%D0%B4_%D1%88%D1%83%D1%85%D0%BE%D0%B2%D1%81%D0%BA%D0%BE%D0%B9_%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%D0%B9.JPG",
  'worker-kolkhoz': "https://commons.wikimedia.org/wiki/File:WorkerAndKolkhozWoman_20100322.jpg",
  'msu': "https://commons.wikimedia.org/wiki/File:Moscow_State_University.jpg",
  'vdnh': "https://commons.wikimedia.org/wiki/File:Moscow._VDNKh_DSC_3753_2350.jpg",
  'ostankino-tower': "https://commons.wikimedia.org/wiki/File:Ostankino_Tower%2C_2015.JPG",
  'motherland': "https://commons.wikimedia.org/wiki/File:%D0%A0%D0%BE%D0%B4%D0%B8%D0%BD%D0%B0-%D0%BC%D0%B0%D1%82%D1%8C_%D0%B7%D0%BE%D0%B2%D0%B5%D1%82!.JPG"
};

const VISUAL_MAPS = {
  'map-east-slavs': {
    title: 'Восточные славяне и Древняя Русь',
    meta: 'IX–XII вв. · карта-схема',
    caption: 'Отрабатывайте расселение племён, путь «из варяг в греки» и города. Подписи намеренно крупные — читайте их как легенду.',
    src: 'assets/visuals/maps/map-east-slavs.svg'
  },
  'map-mongol': {
    title: 'Русь и Орда. Возвышение Москвы',
    meta: 'XIII–XV вв. · карта-схема',
    caption: 'Походы Батыя, Куликовская битва 1380 и стояние на Угре 1480. Сопоставляйте стрелки с годами.',
    src: 'assets/visuals/maps/map-mongol.svg'
  },
  'map-muscovy': {
    title: 'Московское царство',
    meta: 'XVI–XVII вв. · карта-схема',
    caption: 'Казань 1552, Астрахань 1556, Ливонская война. Определяйте направление расширения государства.',
    src: 'assets/visuals/maps/map-muscovy.svg'
  },
  'map-peter': {
    title: 'Россия при Петре I. Северная война',
    meta: '1700–1721 · карта-схема',
    caption: 'Нарва, Полтава 1709, выход к Балтике. Не путайте Швецию с Речью Посполитой.',
    src: 'assets/visuals/maps/map-peter.svg'
  },
  'map-1812': {
    title: 'Отечественная война 1812 года',
    meta: '1812 · карта-схема',
    caption: 'Наступление Наполеона, Бородино, Тарутинский манёвр и отступление. Читайте стрелки по цветам.',
    src: 'assets/visuals/maps/map-1812.svg'
  },
  'map-crimea-1853': {
    title: 'Крымская война 1853–1856',
    meta: '1853–1856 · карта-схема',
    caption: 'Дунай, Севастополь, Синоп и Кавказ. Следите за линиями фронта, высадкой союзников и осадой Севастополя.',
    src: 'assets/visuals/maps/map-crimea-1853.svg'
  },
  'map-crimea-1877': {
    title: 'Русско-турецкая война 1877–1878',
    meta: '1877–1878 · карта-схема',
    caption: 'Переправа у Зимницы, Плевна, Шипка и Сан-Стефано. Различайте Балканский и Кавказский фронты.',
    src: 'assets/visuals/maps/map-crimea-1877.svg'
  },
  'map-civil': {
    title: 'Революции и Гражданская война',
    meta: '1917–1922 · карта-схема',
    caption: 'Петроград, Москва, фронты красных и белых, интервенция. Определяйте лагерь по цвету стрелок.',
    src: 'assets/visuals/maps/map-civil.svg'
  },
  'map-wwii': {
    title: 'Великая Отечественная война',
    meta: '1941–1945 · карта-схема',
    caption: 'Брест, Ленинград, Москва, Сталинград, Курск, Берлин. Восстанавливайте хронологию по подписям.',
    src: 'assets/visuals/maps/map-wwii.svg'
  }
};

const VISUAL_LIBRARY = {
  ...Object.fromEntries(Object.entries(VISUAL_PHOTOS).map(([key, item]) => [key, {
    ...item,
    kind: 'photo',
    src: 'assets/visuals/' + key + '.jpg',
    source: VISUAL_SOURCES[key] || ''
  }])),
  ...Object.fromEntries(Object.entries(VISUAL_MAPS).map(([key, item]) => [key, {
    ...item,
    kind: 'map',
    source: ''
  }]))
};

const TOPIC_VISUALS = {
  'h-east-slavs': ['map-east-slavs', 'sophia-kiev', 'sophia-novgorod', 'uspensky-vladimir', 'pokrova-nerli', 'trinity-rublev'],
  'h-mongol-moscow': ['map-mongol', 'moscow-kremlin', 'trinity-rublev'],
  'h-muscovy': ['map-muscovy', 'saint-basil', 'moscow-kremlin', 'novodevichy'],
  'h-peter': ['map-peter', 'winter-palace', 'bronze-horseman', 'morning-execution'],
  'h-19-century': ['map-1812', 'map-crimea-1853', 'map-crimea-1877', 'pashkov-house', 'bolshoi-theatre', 'isaac-cathedral', 'christ-saviour', 'kazan-cathedral', 'minin-pozharsky', 'mariinsky', 'conservatory', 'last-day-pompeii', 'appearance-christ', 'barge-haulers', 'morning-execution'],
  'h-revolutions': ['map-civil', 'red-horse', 'black-square'],
  'h-early-ussr': ['lenin-mausoleum', 'melnikov-house', 'shukhov-tower', 'worker-kolkhoz'],
  'h-wwii': ['map-wwii', 'motherland'],
  'h-late-ussr': ['msu', 'vdnh', 'ostankino-tower'],
  'h-culture': ['sophia-kiev', 'sophia-novgorod', 'uspensky-vladimir', 'pokrova-nerli', 'trinity-rublev', 'moscow-kremlin', 'saint-basil', 'novodevichy', 'winter-palace', 'pashkov-house', 'bronze-horseman', 'bolshoi-theatre', 'isaac-cathedral', 'christ-saviour', 'kazan-cathedral', 'minin-pozharsky', 'mariinsky', 'conservatory', 'last-day-pompeii', 'appearance-christ', 'barge-haulers', 'morning-execution', 'red-horse', 'black-square', 'lenin-mausoleum', 'melnikov-house', 'shukhov-tower', 'worker-kolkhoz', 'msu', 'vdnh', 'ostankino-tower', 'motherland'],
  'h-map-source': ['map-east-slavs', 'map-mongol', 'map-muscovy', 'map-peter', 'map-1812', 'map-crimea-1853', 'map-crimea-1877', 'map-civil', 'map-wwii']
};
