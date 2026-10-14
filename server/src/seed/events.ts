import type { EventInput } from '@lcn/shared';

// Демонстраційні події в реальних локаціях Львова.
// Для «Арсеналу» навмисно немає польського перекладу — термінал покаже англійський (REQ-1.3).
export const SEED_EVENTS: EventInput[] = [
  {
    startsAt: '2026-10-17T18:00',
    lat: 49.8441,
    lng: 24.0262,
    translations: {
      uk: {
        title: '«Наталка Полтавка»',
        venue: 'Львівська національна опера',
        category: 'Опера',
        description: 'Класична українська опера Миколи Лисенка на головній сцені міста.',
      },
      en: {
        title: 'Natalka Poltavka',
        venue: 'Lviv National Opera',
        category: 'Opera',
        description: 'Mykola Lysenko’s classic Ukrainian opera on the city’s main stage.',
      },
      pl: {
        title: 'Natałka Połtawka',
        venue: 'Lwowska Opera Narodowa',
        category: 'Opera',
        description: 'Klasyczna ukraińska opera Mykoły Łysenki na głównej scenie miasta.',
      },
    },
  },
  {
    startsAt: '2026-10-18T11:00',
    lat: 49.8419,
    lng: 24.0316,
    translations: {
      uk: {
        title: 'Осінній ярмарок на Ринку',
        venue: 'Площа Ринок',
        category: 'Фестиваль',
        description: 'Ремісничі ряди, локальна кава та жива музика просто неба в історичному центрі.',
      },
      en: {
        title: 'Autumn Fair at Rynok Square',
        venue: 'Rynok Square',
        category: 'Festival',
        description: 'Craft stalls, local coffee and live open-air music in the historic centre.',
      },
      pl: {
        title: 'Jesienny jarmark na Rynku',
        venue: 'Rynek',
        category: 'Festiwal',
        description:
          'Stoiska rzemieślnicze, lokalna kawa i muzyka na żywo pod gołym niebem w historycznym centrum.',
      },
    },
  },
  {
    startsAt: '2026-10-19T12:00',
    lat: 49.8418,
    lng: 24.0369,
    translations: {
      uk: {
        title: 'Екскурсія «Майстер Пінзель»',
        venue: 'Музей Пінзеля',
        category: 'Музей',
        description:
          'Екскурсія залами з дерев’яною скульптурою Йоана Георгія Пінзеля, майстра львівського бароко.',
      },
      en: {
        title: 'Tour: Master Pinsel',
        venue: 'Pinsel Museum',
        category: 'Museum',
        description:
          'A guided tour of the halls of wooden sculpture by Johann Georg Pinsel, master of Lviv baroque.',
      },
      pl: {
        title: 'Zwiedzanie: Mistrz Pinsel',
        venue: 'Muzeum Pinsla',
        category: 'Muzeum',
        description:
          'Zwiedzanie z przewodnikiem sal z drewnianymi rzeźbami Jana Jerzego Pinsla, mistrza lwowskiego baroku.',
      },
    },
  },
  {
    startsAt: '2026-10-20T20:00',
    lat: 49.8414,
    lng: 24.035,
    translations: {
      uk: {
        title: 'Нічна екскурсія в Арсеналі',
        venue: 'Музей зброї «Арсенал»',
        category: 'Екскурсія',
        description: 'Вечірня прогулянка міською фортифікацією XVI століття з ліхтарями.',
      },
      en: {
        title: 'Night Tour of the Arsenal',
        venue: 'Arsenal Museum',
        category: 'Tour',
        description: 'An evening walk through the 16th-century city fortifications by lantern light.',
      },
    },
  },
  {
    startsAt: '2026-10-21T19:00',
    lat: 49.8378,
    lng: 24.029,
    translations: {
      uk: {
        title: 'Симфонічний вечір: Скорик',
        venue: 'Львівська філармонія',
        category: 'Концерт',
        description: 'Твори Мирослава Скорика у виконанні симфонічного оркестру філармонії.',
      },
      en: {
        title: 'Symphony Evening: Skoryk',
        venue: 'Lviv Philharmonic',
        category: 'Concert',
        description: 'Works by Myroslav Skoryk performed by the Philharmonic Symphony Orchestra.',
      },
      pl: {
        title: 'Wieczór symfoniczny: Skoryk',
        venue: 'Filharmonia Lwowska',
        category: 'Koncert',
        description: 'Utwory Myrosława Skoryka w wykonaniu orkiestry symfonicznej filharmonii.',
      },
    },
  },
  {
    startsAt: '2026-10-17T10:00',
    lat: 49.837,
    lng: 24.023,
    translations: {
      uk: {
        title: 'Виставка сучасної графіки',
        venue: 'Палац мистецтв',
        category: 'Виставка',
        description: 'Роботи львівських графіків і студентів Академії мистецтв.',
      },
      en: {
        title: 'Contemporary Graphics Exhibition',
        venue: 'Palace of Arts',
        category: 'Exhibition',
        description: 'Works by Lviv graphic artists and students of the Academy of Arts.',
      },
      pl: {
        title: 'Wystawa grafiki współczesnej',
        venue: 'Pałac Sztuki',
        category: 'Wystawa',
        description: 'Prace lwowskich grafików i studentów Akademii Sztuk Pięknych.',
      },
    },
  },
];
