function word(en, zh, partOfSpeech, defEn, synonym, example, zhAliases = []) {
  return { en, zh, partOfSpeech, defEn, synonym, example, zhAliases };
}

const easyWords = [
  word("apple", "苹果", "名词", "A round fruit with red or green skin.", "fruit", "She eats an apple every day.", ["苹果果", "苹果儿"]),
  word("book", "书", "名词", "A set of written or printed pages.", "volume", "This book is very interesting.", ["书本", "书籍"]),
  word("water", "水", "名词", "A clear liquid used for drinking.", "H2O", "Drink more water after exercise.", ["饮用水"]),
  word("school", "学校", "名词", "A place where students learn.", "campus", "He walks to school every morning.", ["校园"]),
  word("family", "家庭", "名词", "People related to each other.", "relatives", "Family support is important.", ["家人"]),
  word("happy", "开心的", "形容词", "Feeling or showing pleasure.", "glad", "The children look happy.", ["开心", "高兴", "高兴的"]),
  word("friend", "朋友", "名词", "A person you like and trust.", "companion", "My friend helps me with homework.", ["伙伴", "好友"]),
  word("sun", "太阳", "名词", "The star that gives Earth light and heat.", "daystar", "The sun is bright today.", ["太阳光", "日头"]),
  word("music", "音乐", "名词", "Pleasant sounds made with voice or instruments.", "melody", "She listens to music while reading.", ["乐曲", "乐声"]),
  word("garden", "花园", "名词", "An area where flowers or plants are grown.", "yard", "We planted roses in the garden.", ["园子", "庭院"]),
  word("dog", "狗", "名词", "An animal often kept as a pet.", "puppy", "The dog runs across the yard.", ["小狗", "狗狗"]),
  word("cat", "猫", "名词", "A small animal with soft fur.", "kitten", "The cat is sleeping on the chair.", ["小猫", "猫咪"]),
  word("house", "房子", "名词", "A building where people live.", "home", "Their house is near the river.", ["房屋", "住宅"]),
  word("car", "汽车", "名词", "A road vehicle with an engine.", "vehicle", "My father drives a car to work.", ["小汽车", "车子"]),
  word("food", "食物", "名词", "Things that people or animals eat.", "meal", "Healthy food gives us energy.", ["食品", "吃的"]),
  word("table", "桌子", "名词", "A piece of furniture with a flat top.", "desk", "The cups are on the table.", ["桌", "餐桌"]),
  word("chair", "椅子", "名词", "A seat for one person.", "seat", "Please sit on the chair.", ["座椅"]),
  word("teacher", "老师", "名词", "A person who teaches students.", "educator", "The teacher explains the question clearly.", ["教师"]),
  word("student", "学生", "名词", "A person who is learning at school.", "learner", "Every student needs enough sleep.", ["学员"]),
  word("breakfast", "早餐", "名词", "The first meal of the day.", "morning meal", "I usually eat bread for breakfast.", ["早饭"]),
  word("lunch", "午餐", "名词", "A meal eaten in the middle of the day.", "midday meal", "We have lunch at twelve o'clock.", ["午饭"]),
  word("dinner", "晚餐", "名词", "The main meal eaten in the evening.", "evening meal", "The family cooks dinner together.", ["晚饭"]),
  word("small", "小的", "形容词", "Little in size.", "tiny", "The box is too small for the toy.", ["小", "较小的"]),
  word("big", "大的", "形容词", "Large in size.", "large", "They live in a big house.", ["大", "很大的"]),
  word("clean", "干净的", "形容词", "Not dirty.", "neat", "The room looks clean now.", ["干净", "整洁的"]),
  word("busy", "忙碌的", "形容词", "Having a lot to do.", "occupied", "She is busy with her homework.", ["忙的", "繁忙的"]),
  word("morning", "早晨", "名词", "The early part of the day.", "dawn", "I like running in the morning.", ["早上", "清晨"]),
  word("night", "夜晚", "名词", "The time when it is dark.", "evening", "The stars shine at night.", ["夜里", "晚上"]),
  word("read", "阅读", "动词", "To look at and understand written words.", "study", "Children read storybooks before bed.", ["读", "朗读"]),
  word("write", "写", "动词", "To make letters or words on paper.", "record", "Please write your name here.", ["书写", "写下"]),
  word("window", "窗户", "名词", "An opening in a wall that lets in light.", "pane", "Please open the window for fresh air.", ["窗子"]),
  word("door", "门", "名词", "A movable barrier used to open or close an entrance.", "gate", "He knocked on the front door.", ["房门", "门口的门"]),
  word("flower", "花", "名词", "The colorful part of a plant.", "blossom", "This flower smells sweet.", ["花朵"]),
  word("river", "河流", "名词", "A natural stream of water.", "stream", "A river runs behind the village.", ["河", "小河"]),
  word("mountain", "山", "名词", "A very high area of land.", "peak", "Snow covers the mountain in winter.", ["山峰"]),
  word("road", "道路", "名词", "A way for cars, bikes, or people to travel on.", "street", "The road is busy after work.", ["马路", "路"]),
  word("bike", "自行车", "名词", "A vehicle with two wheels that you ride.", "bicycle", "She rides her bike to school.", ["单车", "脚踏车"]),
  word("bus", "公共汽车", "名词", "A large road vehicle for many passengers.", "coach", "We take the bus downtown.", ["公交车", "巴士"]),
  word("train", "火车", "名词", "A line of connected railway cars.", "railway", "The train arrives at six.", ["列车"]),
  word("computer", "电脑", "名词", "An electronic machine that stores and processes data.", "PC", "He uses the computer for homework.", ["计算机"]),
  word("phone", "电话", "名词", "A device used to talk to someone far away.", "telephone", "I forgot my phone at home.", ["手机", "电话号码的电话"]),
  word("clothes", "衣服", "名词", "Things people wear on their bodies.", "clothing", "These clothes are warm and soft.", ["服装"]),
  word("fruit", "水果", "名词", "Sweet food that grows on trees or plants.", "produce", "Fresh fruit is good for health.", ["果子"]),
  word("milk", "牛奶", "名词", "A white liquid drink from cows.", "dairy", "Warm milk helps me sleep.", ["奶"]),
  word("bread", "面包", "名词", "Food made from flour and baked.", "loaf", "She bought bread from the bakery.", ["面包片"]),
  word("picture", "图片", "名词", "A drawing or photograph.", "image", "The picture on the wall is beautiful.", ["照片", "图画"]),
  word("weather", "天气", "名词", "The condition of the air outside.", "climate", "The weather is nice today.", ["气候"]),
  word("smile", "微笑", "名词", "A happy expression on the face.", "grin", "Her smile made everyone relax.", ["笑容"]),
  word("answer", "答案", "名词", "Something said or written in reply.", "reply", "I know the answer to this question.", ["回答"]),
  word("question", "问题", "名词", "Something you ask when you want information.", "query", "The teacher asked an easy question.", ["题目", "疑问"])
];

const mediumWords = [
  word("improve", "提升", "动词", "To make something better.", "enhance", "Practice can improve your English.", ["提高", "改进"]),
  word("create", "创造", "动词", "To make something new.", "produce", "Students create a small robot.", ["创建", "创作"]),
  word("travel", "旅行", "动词", "To go from one place to another.", "journey", "They travel by train in summer.", ["旅游", "出行"]),
  word("future", "未来", "名词", "The time that is yet to come.", "prospect", "She plans for her future carefully.", ["将来"]),
  word("energy", "能量", "名词", "Power needed for physical activity.", "power", "Healthy food gives us energy.", ["精力", "力量"]),
  word("memory", "记忆", "名词", "The ability to remember things.", "recollection", "This song brings back old memory.", ["回忆"]),
  word("culture", "文化", "名词", "Ideas and customs of a society.", "civilization", "Food is part of local culture.", ["文明", "文化传统"]),
  word("honest", "诚实的", "形容词", "Telling the truth and not cheating.", "truthful", "An honest answer is always best.", ["诚实", "老实", "老实的"]),
  word("protect", "保护", "动词", "To keep safe from harm.", "guard", "Trees protect the soil from rain.", ["保卫", "守护"]),
  word("discover", "发现", "动词", "To find something for the first time.", "find", "Scientists discover new stars.", ["发觉", "察觉"]),
  word("develop", "发展", "动词", "To grow or change over time.", "grow", "The city continues to develop quickly.", ["成长", "进步"]),
  word("support", "支持", "动词", "To help or agree with someone or something.", "assist", "Parents support their children warmly.", ["帮助", "支撑"]),
  word("prepare", "准备", "动词", "To get ready for something.", "get ready", "We prepare for the exam together.", ["预备", "筹备"]),
  word("compare", "比较", "动词", "To examine how things are similar or different.", "contrast", "Let's compare the two plans.", ["对比"]),
  word("decide", "决定", "动词", "To make a choice.", "determine", "She decides to join the club.", ["下决定", "作出决定"]),
  word("possible", "可能的", "形容词", "Able to happen or exist.", "likely", "Anything is possible with effort.", ["可能", "有可能的"]),
  word("careful", "仔细的", "形容词", "Giving attention to detail.", "cautious", "Be careful when crossing the street.", ["仔细", "小心的"]),
  word("special", "特别的", "形容词", "Different from others in a good way.", "unique", "Today is a special day for us.", ["特殊的", "特别"]),
  word("important", "重要的", "形容词", "Having great value or effect.", "key", "Sleep is important for students.", ["关键的", "重要"]),
  word("popular", "受欢迎的", "形容词", "Liked by many people.", "well-liked", "That singer is popular among teens.", ["热门的", "流行的"]),
  word("practice", "练习", "名词", "Repeated work to improve a skill.", "training", "Daily practice makes pronunciation better.", ["训练"]),
  word("conversation", "对话", "名词", "A talk between two or more people.", "talk", "Their conversation lasted an hour.", ["交谈"]),
  word("knowledge", "知识", "名词", "Information and understanding gained by learning.", "understanding", "Reading adds to our knowledge.", ["学识"]),
  word("environment", "环境", "名词", "The natural world or surroundings.", "surroundings", "We should care for the environment.", ["周围环境"]),
  word("information", "信息", "名词", "Facts or details about something.", "data", "The poster gives useful information.", ["资讯"]),
  word("opportunity", "机会", "名词", "A good chance to do something.", "chance", "This job offers a great opportunity.", ["机遇"]),
  word("experience", "经历", "名词", "Knowledge or skill gained over time.", "undergoing", "Travel is a valuable experience.", ["体验", "经验"]),
  word("include", "包括", "动词", "To have something as part of a whole.", "contain", "The price includes breakfast.", ["包含"]),
  word("achieve", "实现", "动词", "To succeed in doing something.", "accomplish", "You can achieve your goal step by step.", ["达成", "取得"]),
  word("reduce", "减少", "动词", "To make something smaller or less.", "decrease", "We should reduce waste at home.", ["降低", "缩减"]),
  word("relationship", "关系", "名词", "The way two or more people or things are connected.", "connection", "Trust is important in every relationship.", ["联系"]),
  word("method", "方法", "名词", "A particular way of doing something.", "approach", "This method saves a lot of time.", ["办法"]),
  word("communicate", "沟通", "动词", "To share information with others.", "interact", "Good leaders communicate clearly.", ["交流"]),
  word("prefer", "更喜欢", "动词", "To like one thing more than another.", "favor", "I prefer tea to coffee.", ["偏爱", "更偏向"]),
  word("manage", "管理", "动词", "To control or deal with something successfully.", "handle", "She can manage the team well.", ["处理", "设法做到"]),
  word("increase", "增加", "动词", "To become greater in amount or size.", "rise", "Exercise can increase your strength.", ["提升", "增多"]),
  word("solve", "解决", "动词", "To find an answer to a problem.", "fix", "We need to solve this issue today.", ["处理", "搞定"]),
  word("local", "当地的", "形容词", "Belonging to a particular area nearby.", "regional", "We visited a local market.", ["本地的", "当地"]),
  word("tradition", "传统", "名词", "A belief or custom passed down over time.", "custom", "This festival is an old tradition.", ["习俗"]),
  word("education", "教育", "名词", "The process of teaching and learning.", "schooling", "Education changes people's lives.", ["教学"]),
  word("article", "文章", "名词", "A piece of writing in a newspaper or magazine.", "essay", "She wrote an article about health.", ["报道"]),
  word("research", "研究", "名词", "Careful study to discover new facts.", "study", "The team began research on climate.", ["调查"]),
  word("emotion", "情绪", "名词", "A strong feeling such as joy or sadness.", "feeling", "Music can affect our emotion.", ["情感", "感情"]),
  word("habit", "习惯", "名词", "Something you do often and regularly.", "routine", "Reading before bed is a good habit.", ["习性"]),
  word("quality", "质量", "名词", "How good something is.", "standard", "We care about product quality.", ["品质"]),
  word("response", "回应", "名词", "A spoken or written answer.", "reaction", "His response was quick and polite.", ["反应", "答复"]),
  word("topic", "话题", "名词", "A subject people talk or write about.", "subject", "Climate change is an important topic.", ["主题"]),
  word("focus", "专注", "名词", "Special attention given to something.", "attention", "Today's focus is listening practice.", ["集中", "关注点"])
];

const hardWords = [
  word("consequence", "后果", "名词", "A result of an action or condition.", "outcome", "Ignoring warnings has serious consequence.", ["结果"]),
  word("efficient", "高效的", "形容词", "Working well without wasting time.", "productive", "A clear plan makes work more efficient.", ["高效", "效率高", "有效率的"]),
  word("significant", "重要的", "形容词", "Large or important enough to be noticed.", "meaningful", "There is significant progress this week.", ["显著的", "重大的", "重要"]),
  word("perspective", "视角", "名词", "A way of thinking about something.", "viewpoint", "Try to see it from another perspective.", ["角度", "观点"]),
  word("collaborate", "合作", "动词", "To work together with others.", "cooperate", "Teams collaborate to solve hard problems.", ["协作", "配合"]),
  word("motivation", "动力", "名词", "The reason to do something.", "drive", "Progress gives students motivation.", ["驱动力", "积极性"]),
  word("challenge", "挑战", "名词", "A difficult task that tests ability.", "test", "Every level brings a new challenge.", ["难题", "考验"]),
  word("strategy", "策略", "名词", "A detailed plan for success.", "plan", "Our strategy improved the final score.", ["战略", "方案"]),
  word("resource", "资源", "名词", "A supply that can be used.", "asset", "Time is your most valuable resource.", ["物资", "资源条件"]),
  word("resilient", "有韧性的", "形容词", "Able to recover quickly from difficulty.", "tough", "Resilient learners keep trying.", ["有韧性", "坚韧", "坚韧的"]),
  word("analyze", "分析", "动词", "To study something carefully.", "examine", "Scientists analyze the results in detail.", ["解析"]),
  word("maintain", "维持", "动词", "To keep something in good condition.", "preserve", "It is hard to maintain balance at first.", ["保持", "维护"]),
  word("adapt", "适应", "动词", "To change in order to fit a new situation.", "adjust", "Good teams adapt to sudden change.", ["调整以适应", "适应变化"]),
  word("complex", "复杂的", "形容词", "Having many connected parts.", "complicated", "The problem is more complex than it looks.", ["复杂", "繁杂的"]),
  word("accurate", "准确的", "形容词", "Correct and exact.", "precise", "An accurate translation is important.", ["准确", "精确的"]),
  word("flexible", "灵活的", "形容词", "Able to change easily when needed.", "adaptable", "A flexible plan is often safer.", ["灵活", "有弹性的"]),
  word("innovative", "创新的", "形容词", "Using new ideas or methods.", "creative", "The company is known for innovative design.", ["创新", "有创新性的"]),
  word("sustainable", "可持续的", "形容词", "Able to continue for a long time.", "lasting", "We need sustainable ways to save energy.", ["可持续", "持续发展的"]),
  word("essential", "必不可少的", "形容词", "Completely necessary.", "necessary", "Rest is essential for good performance.", ["必要的", "关键的", "不可或缺的"]),
  word("interpret", "解释", "动词", "To explain the meaning of something.", "explain", "Different people interpret the poem differently.", ["解读", "诠释"]),
  word("evaluate", "评估", "动词", "To judge the value or quality of something.", "assess", "Teachers evaluate each project fairly.", ["评价", "考量"]),
  word("implement", "实施", "动词", "To put a plan into action.", "carry out", "The team will implement the new system soon.", ["执行", "落实"]),
  word("allocate", "分配", "动词", "To give different parts of something to different uses.", "assign", "We must allocate time wisely.", ["分派", "调配"]),
  word("negotiate", "协商", "动词", "To discuss in order to reach an agreement.", "discuss", "The two sides negotiate a final price.", ["谈判", "商议"]),
  word("priority", "优先事项", "名词", "Something that is more important than other things.", "main concern", "Safety should be our top priority.", ["优先级", "首要事项"]),
  word("assumption", "假设", "名词", "Something accepted as true without proof.", "belief", "That assumption may be wrong.", ["设想", "假说"]),
  word("framework", "框架", "名词", "A basic structure or system.", "structure", "This framework helps us organize ideas.", ["结构", "体系"]),
  word("clarify", "澄清", "动词", "To make something easier to understand.", "make clear", "Please clarify the last point again.", ["说明清楚", "阐明"]),
  word("consistent", "一致的", "形容词", "Always behaving in the same way.", "steady", "Consistent effort leads to progress.", ["稳定的", "前后一致的"]),
  word("transform", "转变", "动词", "To change something greatly.", "change", "Technology can transform daily life.", ["改变", "转化"]),
  word("concept", "概念", "名词", "An abstract idea or general notion.", "idea", "The concept sounds simple but is powerful.", ["观念"]),
  word("phenomenon", "现象", "名词", "A fact or event that can be observed.", "occurrence", "Rainbows are a natural phenomenon.", ["现象表现"]),
  word("diverse", "多样的", "形容词", "Showing a great deal of variety.", "varied", "The city has a diverse culture.", ["多元的", "丰富多样的"]),
  word("establish", "建立", "动词", "To start or set up something firmly.", "found", "They want to establish clear rules.", ["创立", "设立"]),
  word("intervene", "干预", "动词", "To become involved in a situation to change it.", "step in", "Teachers may intervene when problems grow.", ["介入"]),
  word("inevitable", "不可避免的", "形容词", "Certain to happen and impossible to avoid.", "unavoidable", "Some change is inevitable.", ["必然的", "难以避免的"]),
  word("reliability", "可靠性", "名词", "The quality of being dependable.", "dependability", "Engineers tested the reliability of the system.", ["可信度"]),
  word("hypothesis", "假设", "名词", "An idea used as a starting point for explanation.", "theory", "The scientist tested her hypothesis.", ["假说"]),
  word("comprehensive", "全面的", "形容词", "Including many details and covering everything important.", "thorough", "They wrote a comprehensive report.", ["综合的", "详尽的"]),
  word("emphasize", "强调", "动词", "To give special importance to something.", "stress", "The coach emphasized teamwork.", ["着重指出", "突出"]),
  word("derive", "得出", "动词", "To obtain something from a source.", "obtain", "We can derive meaning from context.", ["推导出", "推得"]),
  word("ethical", "道德的", "形容词", "Morally right and acceptable.", "moral", "Doctors face ethical decisions every day.", ["合乎伦理的", "伦理上的"]),
  word("advocate", "提倡", "动词", "To publicly support an idea or plan.", "support", "Many teachers advocate active learning.", ["主张", "倡导"]),
  word("regulate", "规范", "动词", "To control something by rules.", "control", "Laws regulate food safety.", ["监管", "调节"]),
  word("objective", "目标", "名词", "Something you are trying to achieve.", "goal", "Our objective is to reduce waste.", ["目的"]),
  word("precisely", "精确地", "副词", "In a very exact way.", "exactly", "Please explain the rule precisely.", ["准确地"]),
  word("theory", "理论", "名词", "A set of ideas intended to explain something.", "principle", "This theory changed modern science.", ["学说"])
];

export const difficultyConfig = {
  easy: {
    label: "简单",
    speed: 28,
    hp: 5,
    points: 10,
    words: easyWords
  },
  medium: {
    label: "中等",
    speed: 34,
    hp: 5,
    points: 18,
    words: mediumWords
  },
  hard: {
    label: "困难",
    speed: 34,
    hp: 4,
    points: 30,
    words: hardWords
  }
};

export const shopItems = [
  {
    id: "skipPack",
    name: "秒杀子弹补给",
    cost: 60,
    desc: "下局开场直接获得 3 发秒杀子弹。",
    short: "秒杀子弹 +3"
  },
  {
    id: "shieldBoost",
    name: "基地护盾",
    cost: 80,
    desc: "下局基地血量额外 +1。",
    short: "基地血量 +1"
  },
  {
    id: "slowChip",
    name: "减速芯片",
    cost: 90,
    desc: "下局怪物移动速度降低 15%。",
    short: "怪物减速 15%"
  },
  {
    id: "scoreBoost",
    name: "积分增幅器",
    cost: 110,
    desc: "下局击杀积分提升至 1.5 倍。",
    short: "击杀积分 x1.5"
  },
  {
    id: "freezeBomb",
    name: "冻结脉冲",
    cost: 70,
    desc: "战斗中主动使用，冻结所有场上怪物 3 秒。",
    short: "全场冻结 3 秒"
  },
  {
    id: "clearBomb",
    name: "清屏炸弹",
    cost: 130,
    desc: "战斗中主动使用，直接清除当前场上的全部怪物并获得积分。",
    short: "清除场上怪物"
  }
];

export function createEmptyInventory() {
  return {
    skipPack: 0,
    shieldBoost: 0,
    slowChip: 0,
    scoreBoost: 0,
    freezeBomb: 0,
    clearBomb: 0
  };
}
