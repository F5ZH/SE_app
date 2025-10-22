import { WordBook } from '../types';

/**
 * 预设词书数据
 * 包含常用的英语词汇书
 */

// 生成唯一ID的工具函数
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 四级词汇
export const cet4Words: WordBook = {
  id: generateId(),
  name: '大学英语四级词汇',
  description: '包含约4000个四级核心词汇，适合大学生和英语学习者',
  totalWords: 0,
  isPreset: true,
  createdAt: Date.now(),
  words: [
    {
      id: generateId(),
      word: 'abandon',
      pronunciation: '/əˈbændən/',
      translation: 'v. 放弃，抛弃',
      example: 'He had to abandon his car in the snow.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'ability',
      pronunciation: '/əˈbɪləti/',
      translation: 'n. 能力，才能',
      example: 'She has the ability to solve complex problems.',
      difficulty: 2,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'absolute',
      pronunciation: '/ˈæbsəluːt/',
      translation: 'adj. 绝对的，完全的',
      example: 'There is no absolute truth in this matter.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accept',
      pronunciation: '/əkˈsept/',
      translation: 'v. 接受，承认',
      example: 'I accept your invitation to the party.',
      difficulty: 1,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'access',
      pronunciation: '/ˈækses/',
      translation: 'n. 通道，接近；v. 访问',
      example: 'Students have access to the library 24/7.',
      difficulty: 2,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accident',
      pronunciation: '/ˈæksɪdənt/',
      translation: 'n. 事故，意外',
      example: 'The car accident was caused by speeding.',
      difficulty: 1,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accompany',
      pronunciation: '/əˈkʌmpəni/',
      translation: 'v. 陪伴，伴随',
      example: 'She will accompany me to the meeting.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accomplish',
      pronunciation: '/əˈkʌmplɪʃ/',
      translation: 'v. 完成，实现',
      example: 'We accomplished our goal ahead of schedule.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'account',
      pronunciation: '/əˈkaʊnt/',
      translation: 'n. 账户，解释；v. 解释',
      example: 'Please check your bank account balance.',
      difficulty: 2,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accurate',
      pronunciation: '/ˈækjərət/',
      translation: 'adj. 准确的，精确的',
      example: 'The weather forecast was not accurate.',
      difficulty: 3,
      createdAt: Date.now()
    }
  ]
};

// 六级词汇
export const cet6Words: WordBook = {
  id: generateId(),
  name: '大学英语六级词汇',
  description: '包含约6000个六级核心词汇，适合英语水平较高的学习者',
  totalWords: 0,
  isPreset: true,
  createdAt: Date.now(),
  words: [
    {
      id: generateId(),
      word: 'abundant',
      pronunciation: '/əˈbʌndənt/',
      translation: 'adj. 丰富的，充裕的',
      example: 'The region has abundant natural resources.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'academic',
      pronunciation: '/ˌækəˈdemɪk/',
      translation: 'adj. 学术的，学院的',
      example: 'She has a strong academic background.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accelerate',
      pronunciation: '/əkˈseləreɪt/',
      translation: 'v. 加速，促进',
      example: 'The car accelerated down the highway.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accommodate',
      pronunciation: '/əˈkɒmədeɪt/',
      translation: 'v. 容纳，适应',
      example: 'The hotel can accommodate 200 guests.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accumulate',
      pronunciation: '/əˈkjuːmjəleɪt/',
      translation: 'v. 积累，堆积',
      example: 'Dust tends to accumulate in corners.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'acknowledge',
      pronunciation: '/əkˈnɒlɪdʒ/',
      translation: 'v. 承认，感谢',
      example: 'I acknowledge your contribution to the project.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'acquire',
      pronunciation: '/əˈkwaɪə/',
      translation: 'v. 获得，学到',
      example: 'She acquired new skills through practice.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'activate',
      pronunciation: '/ˈæktɪveɪt/',
      translation: 'v. 激活，启动',
      example: 'Please activate your account by clicking the link.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'adequate',
      pronunciation: '/ˈædɪkwət/',
      translation: 'adj. 足够的，适当的',
      example: 'The salary is adequate for my needs.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'adjacent',
      pronunciation: '/əˈdʒeɪsənt/',
      translation: 'adj. 邻近的，毗邻的',
      example: 'The hotel is adjacent to the train station.',
      difficulty: 4,
      createdAt: Date.now()
    }
  ]
};

// 托福词汇
export const toeflWords: WordBook = {
  id: generateId(),
  name: '托福核心词汇',
  description: '包含约8000个托福考试核心词汇，适合准备出国留学的学生',
  totalWords: 0,
  isPreset: true,
  createdAt: Date.now(),
  words: [
    {
      id: generateId(),
      word: 'abandonment',
      pronunciation: '/əˈbændənmənt/',
      translation: 'n. 放弃，抛弃',
      example: 'The abandonment of the project was disappointing.',
      difficulty: 5,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'abbreviate',
      pronunciation: '/əˈbriːvieɪt/',
      translation: 'v. 缩写，缩短',
      example: 'Please abbreviate your name on the form.',
      difficulty: 5,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'abnormal',
      pronunciation: '/æbˈnɔːməl/',
      translation: 'adj. 异常的，不正常的',
      example: 'The test results showed abnormal levels.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'abolish',
      pronunciation: '/əˈbɒlɪʃ/',
      translation: 'v. 废除，取消',
      example: 'The government decided to abolish the old law.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'abrupt',
      pronunciation: '/əˈbrʌpt/',
      translation: 'adj. 突然的，陡峭的',
      example: 'The meeting came to an abrupt end.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'absorption',
      pronunciation: '/əbˈzɔːpʃən/',
      translation: 'n. 吸收，专注',
      example: 'The absorption of nutrients is important for health.',
      difficulty: 5,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'abstract',
      pronunciation: '/ˈæbstrækt/',
      translation: 'adj. 抽象的；n. 摘要',
      example: 'The concept is too abstract for children.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'abundant',
      pronunciation: '/əˈbʌndənt/',
      translation: 'adj. 丰富的，充裕的',
      example: 'The ocean is abundant with marine life.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'academic',
      pronunciation: '/ˌækəˈdemɪk/',
      translation: 'adj. 学术的，理论的',
      example: 'Academic research requires careful methodology.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accelerate',
      pronunciation: '/əkˈseləreɪt/',
      translation: 'v. 加速，促进',
      example: 'The company needs to accelerate its growth.',
      difficulty: 4,
      createdAt: Date.now()
    }
  ]
};

// 雅思词汇
export const ieltsWords: WordBook = {
  id: generateId(),
  name: '雅思核心词汇',
  description: '包含约6000个雅思考试核心词汇，适合准备移民或留学的学生',
  totalWords: 0,
  isPreset: true,
  createdAt: Date.now(),
  words: [
    {
      id: generateId(),
      word: 'accommodation',
      pronunciation: '/əˌkɒməˈdeɪʃən/',
      translation: 'n. 住宿，膳宿',
      example: 'The hotel provides excellent accommodation.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accompany',
      pronunciation: '/əˈkʌmpəni/',
      translation: 'v. 陪伴，伴随',
      example: 'Music often accompanies dance performances.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accomplish',
      pronunciation: '/əˈkʌmplɪʃ/',
      translation: 'v. 完成，实现',
      example: 'She accomplished her goals through hard work.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'account',
      pronunciation: '/əˈkaʊnt/',
      translation: 'n. 账户，解释；v. 解释',
      example: 'Please give an account of what happened.',
      difficulty: 2,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accumulate',
      pronunciation: '/əˈkjuːmjəleɪt/',
      translation: 'v. 积累，堆积',
      example: 'Snow began to accumulate on the ground.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'accurate',
      pronunciation: '/ˈækjərət/',
      translation: 'adj. 准确的，精确的',
      example: 'The measurements must be accurate.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'achieve',
      pronunciation: '/əˈtʃiːv/',
      translation: 'v. 实现，达到',
      example: 'He achieved great success in his career.',
      difficulty: 2,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'acknowledge',
      pronunciation: '/əkˈnɒlɪdʒ/',
      translation: 'v. 承认，感谢',
      example: 'I acknowledge your help with this project.',
      difficulty: 4,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'acquire',
      pronunciation: '/əˈkwaɪə/',
      translation: 'v. 获得，学到',
      example: 'Students acquire knowledge through study.',
      difficulty: 3,
      createdAt: Date.now()
    },
    {
      id: generateId(),
      word: 'activate',
      pronunciation: '/ˈæktɪveɪt/',
      translation: 'v. 激活，启动',
      example: 'Press the button to activate the system.',
      difficulty: 3,
      createdAt: Date.now()
    }
  ]
};

// 所有预设词书
export const presetWordBooks: WordBook[] = [
  cet4Words,
  cet6Words,
  toeflWords,
  ieltsWords
];

// 更新词书的总单词数
presetWordBooks.forEach(book => {
  book.totalWords = book.words.length;
});
