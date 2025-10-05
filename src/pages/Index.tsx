import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

type GameState = 'menu' | 'arrival' | 'door-dialogue' | 'house' | 'inspection' | 'dialogue' | 'kcs' | 'journal' | 'window' | 'naked-guest' | 'death' | 'alone' | 'player-infected' | 'self-check' | 'tv';

interface Person {
  id: number;
  name: string;
  isInfected: boolean;
  avatar: string;
  suspiciousTraits: string[];
  wasChecked: boolean;
  dialogue: string[];
  currentDialogueIndex: number;
  isStranger?: boolean;
  strangerStory?: string;
}

const guestTraits = [
  { id: 1, name: 'Необычные движения', icon: 'Move', description: 'Резкие, угловатые движения после заражения паразитом', check: 'Проверить движения' },
  { id: 2, name: 'Странное дыхание', icon: 'Wind', description: 'Паразит влияет на дыхательные функции', check: 'Послушать дыхание' },
  { id: 3, name: 'Блеск глаз', icon: 'Eye', description: 'Стеклянный взгляд — признак контроля паразита', check: 'Посмотреть в глаза' },
  { id: 4, name: 'Температура тела', icon: 'Thermometer', description: 'Холодная кожа из-за обморожения', check: 'Проверить руки' },
  { id: 5, name: 'Отсутствие эмоций', icon: 'UserX', description: 'Паразит подавляет эмоциональные реакции', check: 'Задать вопрос' },
  { id: 6, name: 'Нечёткое отражение', icon: 'Mirror', description: 'Аномалия, связанная с паразитом', check: 'Проверить зеркалом' },
  { id: 7, name: 'Необычные звуки', icon: 'Volume2', description: 'Шёпот и хрипы при деградации мозга', check: 'Послушать голос' },
  { id: 8, name: 'Неадекватные ответы', icon: 'MessageSquare', description: 'Потеря когнитивных функций', check: 'Провести беседу' },
  { id: 9, name: 'Отсутствие тени', icon: 'Sun', description: 'Неизученная аномалия паразита', check: 'Проверить тень' },
  { id: 10, name: 'Изменение запаха', icon: 'Scan', description: 'Разложение тканей под контролем паразита', check: 'Понюхать' },
];

const dialogues = {
  doorNormal: [
    "Пожалуйста, впустите! На улице жуткий холод, блять!",
    "Я с соседней улицы, дом разрушен... Помогите, ёб твою мать!",
    "Я замерзаю, сука... Прошу вас, откройте дверь!",
    "Там все мертвы... Я один выжил, блядь...",
    "Какого хуя вы медлите?! Впустите меня!",
    "Я не паразит, чёрт возьми! Откройте уже!",
  ],
  doorInfected: [
    "Откройте... пожалуйста...",
    "Холодно... так холодно... впустите...",
    "Я... я не помню... где я...",
    "Дверь... откройте дверь... сейчас...",
    "Пустите... ко мне... в голову... голоса...",
  ],
  normal: [
    "Спасибо, что впустили! Там пиздец какой холод...",
    "Я шёл из соседнего района, видел охуеть сколько замёрзших.",
    "Как вы думаете, когда закончится эта ёбаная жесть?",
    "У вас есть что пожрать? Я два дня нихуя не ел.",
    "Там снаружи реально страшно, бля...",
  ],
  infected: [
    "Да... холодно было... очень...",
    "Я... я не помню как сюда попал...",
    "В ушах странный звук... вы слышите?",
    "Почему вы на меня так смотрите?...",
    "Мне... нужно... поспать... сейчас...",
  ],
  doorResponses: [
    "Кто вы?",
    "Откуда вы пришли?",
    "Что случилось?",
    "Вы один?",
  ],
  responses: [
    "Откуда вы пришли?",
    "Что случилось на улице?",
    "Как вы себя чувствуете?",
    "Вы один были?",
  ]
};

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [day, setDay] = useState(1);
  const [survivedDays, setSurvivedDays] = useState(0);
  const [peopleInHouse, setPeopleInHouse] = useState<Person[]>([]);
  const [currentArrival, setCurrentArrival] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [journalEntries, setJournalEntries] = useState<string[]>([]);
  const [aloneWarning, setAloneWarning] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{sender: string, text: string}[]>([]);
  const [discoveredTraits, setDiscoveredTraits] = useState<string[]>([]);
  const [nakedGuestWarnings, setNakedGuestWarnings] = useState<string[]>([]);
  const [deathDialogueIndex, setDeathDialogueIndex] = useState(0);
  const [innocentKills, setInnocentKills] = useState(0);
  const [playerInfected, setPlayerInfected] = useState(false);
  const [infectionCutsceneStep, setInfectionCutsceneStep] = useState(0);
  const [streetDescription, setStreetDescription] = useState('');
  const [personIdCounter, setPersonIdCounter] = useState(1000);

  let audioContext: AudioContext | null = null;
  let backgroundOscillator: OscillatorNode | null = null;

  const getAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  };

  const startBackgroundMusic = () => {
    if (backgroundOscillator) return;
    try {
      const ctx = getAudioContext();
      backgroundOscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      backgroundOscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      backgroundOscillator.type = 'sine';
      backgroundOscillator.frequency.value = 30;
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
      
      backgroundOscillator.start();
    } catch (e) {
      console.log('Background music not supported');
    }
  };

  const stopBackgroundMusic = () => {
    if (backgroundOscillator) {
      try {
        backgroundOscillator.stop();
        backgroundOscillator = null;
      } catch (e) {
        console.log('Stop music error');
      }
    }
  };

  const playSound = (type: 'knock' | 'door' | 'footstep' | 'gunshot' | 'scream' | 'click' | 'tension' | 'ambient') => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      switch(type) {
        case 'knock':
          oscillator.frequency.value = 200;
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case 'gunshot':
          oscillator.frequency.value = 100;
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'scream':
          oscillator.frequency.value = 400;
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.4);
          break;
        case 'door':
          oscillator.frequency.value = 150;
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'footstep':
          oscillator.frequency.value = 80;
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case 'click':
          oscillator.frequency.value = 600;
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.05);
          break;
        case 'tension':
          oscillator.type = 'sine';
          oscillator.frequency.value = 50;
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
          oscillator.frequency.linearRampToValueAtTime(150, ctx.currentTime + 2);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 2);
          break;
        case 'ambient':
          oscillator.type = 'sine';
          oscillator.frequency.value = 40;
          gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 5);
          break;
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const strangerStories = [
    "День 1: Меня выгнали из паба... Я лишь сказал им: 'Хватит быть тварями, давайте быть людьми'. Они не поняли...",
    "День 2: Я видел, как паразит берёт контроль. Сначала глаза... потом разум. Но меня он не тронет.",
    "День 3: Люди боятся холода. Но холод — это не враг. Враг — это то, что внутри них.",
    "День 4: Я помню времена до аномалии. Мы были другими... или нет?",
    "День 5: Паразит не может меня заразить. Я знаю почему, но не могу сказать.",
    "День 6: Каждую ночь я слышу их шёпот. Они зовут меня. Но я не иду.",
    "День 7: Скоро всё закончится. Или начнётся заново.",
  ];

  const nakedGuestMessages = [
    "Я вижу тебя через окно... Ты так уязвим...",
    "Скоро я войду... Дверь не остановит меня...",
    "Ты один? Как жаль... Я уже иду...",
    "Я слышу твоё дыхание... Ты боишься?",
    "Мясо... Свежее мясо... Я голоден...",
    "Твои друзья уже мертвы... Ты следующий...",
    "Холод... Вечный холод... Присоединись ко мне...",
  ];

  const deathDialogue = [
    "Ты умер.",
    "Но смерть — это не конец.",
    "Это освобождение.",
    "Ты обрёл покой.",
    "Больше нет боли. Нет страха.",
    "Добро пожаловать домой."
  ];

  const tvNews = [
    "📺 СРОЧНО: Аномальный холод охватил весь регион. Температура -50°C.",
    "📺 Власти рекомендуют не выходить на улицу. Случаи обморожения участились.",
    "📺 Учёные обнаружили неизвестный паразитический организм в телах замёрзших.",
    "📺 ВНИМАНИЕ: Паразит проникает через уши и берёт контроль над мозгом.",
    "📺 Зафиксированы случаи агрессии у заражённых. Избегайте контакта.",
    "📺 Карантин объявлен по всему городу. Военные патрулируют улицы.",
    "📺 День 7: Связь с соседними городами потеряна. Мы одни.",
  ];

  const tvAds = [
    "🛒 АКЦИЯ! Консервы 'Выживание' — запас на 10 лет! Звоните: 8-800-555-DEAD",
    "🔥 Обогреватели 'ТеплоМакс' — работают даже при -100°C! Осталось 2 штуки!",
    "💊 Витамины 'ИммуноЩит' — защита от всех болезней! Доставка дронами!",
    "🏠 Бункеры под ключ! Установка за 24 часа! Скидка 50% при заказе сегодня!",
    "🔫 Оружие для самообороны! Лицензия не требуется в режиме ЧС!",
    "📡 Спутниковая связь 'КонтактПлюс' — когда все сети мертвы!",
    "🍖 Синтетическое мясо 'ВкусЖизни' — не отличишь от настоящего!",
  ];

  const infectionCutscene = [
    "Ты убил двух невинных людей...",
    "Паразит начинает проникать в твой разум...",
    "Ты чувствуешь холод... внутри...",
    "Твои руки... они двигаются сами по себе...",
    "ТЫ БОЛЬШЕ НЕ КОНТРОЛИРУЕШЬ СЕБЯ",
    "*КРИКИ И ЗВУКИ БОРЬБЫ*",
    "Все мертвы. Ты убил их всех.",
    "Теперь ты один из НИХ."
  ];

  const streetDescriptions = [
    "Пустая заснеженная улица. Ветер воет между домов. Ни души...",
    "Вдали виднеется тень человека. Он стоит неподвижно и смотрит на твой дом.",
    "Несколько замёрзших тел лежат прямо на дороге. Один из них шевелится...",
    "Группа людей быстро бежит мимо. Они не оглядываются. За ними кто-то гонится.",
    "Голый Гость стоит напротив и смотрит прямо в окно. Он улыбается.",
    "Кто-то стучится в окно соседнего дома. Изнутри никто не отвечает.",
    "Стая воронов кружит над телами. Они что-то клюют.",
    "Человек ползёт по снегу, оставляя кровавый след. Он тянет руку к твоему дому.",
  ];

  const generatePerson = (forceStranger: boolean = false): Person => {
    const newId = personIdCounter;
    setPersonIdCounter(prev => prev + 1);
    
    if (forceStranger) {
      const storyIndex = day - 1;
      const currentStory = strangerStories[storyIndex] || "Я здесь... Наблюдаю.";
      
      return {
        id: newId,
        name: 'Незнакомец',
        isInfected: false,
        avatar: '✨',
        suspiciousTraits: [],
        wasChecked: false,
        dialogue: [
          currentStory,
          "Я единственный, кто остался человеком.",
          "Паразит не может меня заразить.",
          "Вокруг меня светлая аура — видишь?"
        ],
        currentDialogueIndex: 0,
        isStranger: true,
        strangerStory: currentStory
      };
    }

    const isInfected = Math.random() > 0.6;
    const names = ['Алексей', 'Мария', 'Иван', 'Елена', 'Дмитрий', 'Анна', 'Сергей', 'Ольга'];
    const suspiciousCount = isInfected ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2);
    const selectedTraits = [...guestTraits]
      .sort(() => Math.random() - 0.5)
      .slice(0, suspiciousCount)
      .map(t => t.name);

    const doorDialoguePool = isInfected ? dialogues.doorInfected : dialogues.doorNormal;
    const insideDialoguePool = isInfected ? dialogues.infected : dialogues.normal;
    const selectedDialogue = [...doorDialoguePool, ...insideDialoguePool].sort(() => Math.random() - 0.5);

    return {
      id: newId,
      name: names[Math.floor(Math.random() * names.length)],
      isInfected,
      avatar: '👤',
      suspiciousTraits: selectedTraits,
      wasChecked: false,
      dialogue: selectedDialogue,
      currentDialogueIndex: 0,
    };
  };

  const startGame = () => {
    setPersonIdCounter(1000);
    const friend = {
      id: 999,
      name: 'Олег',
      isInfected: false,
      avatar: '👨',
      suspiciousTraits: [],
      wasChecked: true,
      dialogue: [
        "Помнишь, как твой брат познакомил нас? Хорошие были времена...",
        "До аномалии я работал инженером. Теперь это не важно.",
        "Я остался у тебя ночевать как раз когда началось это дерьмо.",
        "Твой брат... Я не знаю, где он сейчас. Надеюсь, он в безопасности.",
        "Мы выживем. Я верю в это."
      ],
      currentDialogueIndex: 0,
      isStranger: true,
      strangerStory: "Это Олег, друг твоего брата. Он остался у тебя ночевать когда началась аномалия. Ты ему доверяешь."
    };
    setPeopleInHouse([friend]);
    setDay(1);
    setSurvivedDays(0);
    setInnocentKills(0);
    setPlayerInfected(false);
    setInfectionCutsceneStep(0);
    setJournalEntries([
      'День 1: Начался аномальный холод. Выходить на улицу опасно.',
      'День 1: Олег, друг моего брата, остался у меня ночевать. Хорошо, что я не один.'
    ]);
    setCurrentArrival(generatePerson());
    setGameState('arrival');
    setAloneWarning(false);
    startBackgroundMusic();
    playSound('knock');
  };

  const startDoorDialogue = () => {
    if (!currentArrival) return;
    playSound('click');
    setChatHistory([{
      sender: currentArrival.name,
      text: currentArrival.dialogue[0]
    }]);
    setCurrentArrival({...currentArrival, currentDialogueIndex: 0});
    setGameState('door-dialogue');
  };

  const sendDoorMessage = () => {
    if (!userMessage.trim() || !currentArrival) return;
    
    playSound('click');
    setChatHistory(prev => [...prev, {
      sender: 'Вы',
      text: userMessage
    }]);

    setTimeout(() => {
      const nextIndex = currentArrival.currentDialogueIndex + 1;
      if (nextIndex < currentArrival.dialogue.length) {
        setChatHistory(prev => [...prev, {
          sender: currentArrival.name,
          text: currentArrival.dialogue[nextIndex]
        }]);
        setCurrentArrival({...currentArrival, currentDialogueIndex: nextIndex});
      } else {
        setChatHistory(prev => [...prev, {
          sender: currentArrival.name,
          text: currentArrival.isInfected 
            ? "Пустите... пожалуйста... холодно..." 
            : "Пожалуйста, откройте дверь! Я замерзаю!"
        }]);
      }
    }, 1000);

    setUserMessage('');
  };

  const letPersonIn = () => {
    if (!currentArrival) return;
    
    playSound('door');
    setTimeout(() => playSound('footstep'), 300);
    setTimeout(() => playSound('footstep'), 600);
    
    setPeopleInHouse(prev => [...prev, currentArrival]);
    setJournalEntries(prev => [...prev, `День ${day}: Впустили ${currentArrival.name} в дом.`]);
    setCurrentArrival(null);
    setChatHistory([]);
    setGameState('house');
    setAloneWarning(false);
  };

  const denyPerson = () => {
    if (!currentArrival) return;
    
    playSound('door');
    if (currentArrival.isInfected) {
      setTimeout(() => playSound('scream'), 500);
    }
    setJournalEntries(prev => [...prev, `День ${day}: Отказали ${currentArrival.name}. Они остались на морозе...`]);
    setCurrentArrival(null);
    setChatHistory([]);
    setGameState('house');
  };

  const startInspection = (person: Person) => {
    playSound('click');
    setSelectedPerson(person);
    setChatHistory([]);
    setDiscoveredTraits([]);
    setGameState('inspection');
  };

  const checkTrait = (traitName: string) => {
    if (!selectedPerson || discoveredTraits.includes(traitName)) return;
    
    if (selectedPerson.isStranger) {
      setChatHistory(prev => [...prev, {
        sender: 'system',
        text: `✨ Незнакомца невозможно проверить. Вокруг него светлая аура — он единственный настоящий человек.`
      }]);
      return;
    }
    
    playSound('footstep');
    setDiscoveredTraits(prev => [...prev, traitName]);
    
    if (selectedPerson.suspiciousTraits.includes(traitName)) {
      setChatHistory(prev => [...prev, {
        sender: 'system',
        text: `⚠️ Обнаружен признак: ${traitName}`
      }]);
    } else {
      setChatHistory(prev => [...prev, {
        sender: 'system',
        text: `✓ ${traitName}: норма`
      }]);
    }
  };

  const talkToPerson = () => {
    if (!selectedPerson) return;
    
    playSound('click');
    setGameState('dialogue');
    setChatHistory([{
      sender: selectedPerson.name,
      text: selectedPerson.dialogue[0]
    }]);
  };

  const sendMessage = () => {
    if (!userMessage.trim() || !selectedPerson) return;
    
    playSound('click');
    setChatHistory(prev => [...prev, {
      sender: 'Вы',
      text: userMessage
    }]);

    setTimeout(() => {
      if (selectedPerson.isStranger) {
        const nextIndex = selectedPerson.currentDialogueIndex + 1;
        if (nextIndex < selectedPerson.dialogue.length) {
          setChatHistory(prev => [...prev, {
            sender: selectedPerson.name,
            text: selectedPerson.dialogue[nextIndex]
          }]);
          setSelectedPerson({...selectedPerson, currentDialogueIndex: nextIndex});
        } else {
          setChatHistory(prev => [...prev, {
            sender: selectedPerson.name,
            text: "Я здесь, чтобы помочь тебе выжить. Верь мне."
          }]);
        }
      } else {
        const nextIndex = selectedPerson.currentDialogueIndex + 1;
        if (nextIndex < selectedPerson.dialogue.length) {
          setChatHistory(prev => [...prev, {
            sender: selectedPerson.name,
            text: selectedPerson.dialogue[nextIndex]
          }]);
          setSelectedPerson({...selectedPerson, currentDialogueIndex: nextIndex});
        } else {
          setChatHistory(prev => [...prev, {
            sender: selectedPerson.name,
            text: selectedPerson.isInfected 
              ? "Я... я хочу спать..." 
              : "Спасибо за помощь. Надеюсь, мы выживем."
          }]);
        }
      }
    }, 1000);

    setUserMessage('');
  };

  const shootPerson = () => {
    if (!selectedPerson) return;
    
    if (selectedPerson.isStranger) {
      setChatHistory(prev => [...prev, {
        sender: 'system',
        text: `✨ Курок не нажимается... От Незнакомца исходит светлая аура. Он единственный настоящий человек здесь.`
      }]);
      return;
    }
    
    playSound('gunshot');
    
    if (selectedPerson.isInfected) {
      setTimeout(() => playSound('scream'), 200);
      setPeopleInHouse(prev => prev.filter(p => p.id !== selectedPerson.id));
      setJournalEntries(prev => [...prev, `День ${day}: Застрелили ${selectedPerson.name}. Это был заражённый. Правильное решение.`]);
    } else {
      setTimeout(() => playSound('scream'), 200);
      setPeopleInHouse(prev => prev.filter(p => p.id !== selectedPerson.id));
      setJournalEntries(prev => [...prev, `День ${day}: Застрелили невинного ${selectedPerson.name}... Ошибка.`]);
      
      const newKillCount = innocentKills + 1;
      setInnocentKills(newKillCount);
      
      if (newKillCount >= 2) {
        setPlayerInfected(true);
        setInfectionCutsceneStep(0);
        setTimeout(() => {
          setGameState('player-infected');
          playSound('scream');
        }, 1500);
        return;
      }
    }
    
    setSelectedPerson(null);
    setGameState('house');
  };

  const finishInspection = () => {
    if (!selectedPerson) return;
    
    setPeopleInHouse(prev => 
      prev.map(p => p.id === selectedPerson.id ? { ...p, wasChecked: true } : p)
    );
    
    setJournalEntries(prev => [...prev, `День ${day}: Проверка ${selectedPerson.name} завершена.`]);
    setSelectedPerson(null);
    setGameState('house');
  };

  const lookOutWindow = () => {
    playSound('click');
    const randomStreet = streetDescriptions[Math.floor(Math.random() * streetDescriptions.length)];
    setStreetDescription(randomStreet);
    const randomMessage = nakedGuestMessages[Math.floor(Math.random() * nakedGuestMessages.length)];
    setNakedGuestWarnings([randomMessage]);
    setGameState('window');
    
    if (peopleInHouse.length < 2) {
      setTimeout(() => {
        setGameState('naked-guest');
        playSound('door');
        setTimeout(() => playSound('scream'), 1000);
      }, 2000);
    }
  };

  const checkSelf = () => {
    playSound('click');
    setGameState('self-check');
  };

  const continueInfectionCutscene = () => {
    playSound('click');
    if (infectionCutsceneStep < infectionCutscene.length - 1) {
      setInfectionCutsceneStep(prev => prev + 1);
      if (infectionCutsceneStep === 4) {
        playSound('scream');
      }
    } else {
      setGameState('death');
      setDeathDialogueIndex(0);
    }
  };

  const endDay = () => {
    const uncheckedInfected = peopleInHouse.find(p => p.isInfected && !p.wasChecked && !p.isStranger);
    
    if (uncheckedInfected) {
      setTimeout(() => playSound('scream'), 800);
      setTimeout(() => playSound('scream'), 1500);
      setJournalEntries(prev => [...prev, `Ночь дня ${day}: ${uncheckedInfected.name} потерял контроль. Паразит взял верх. Все мертвы.`]);
      setTimeout(() => {
        setGameState('death');
        setDeathDialogueIndex(0);
      }, 2000);
      return;
    }

    const nextDay = day + 1;
    setDay(nextDay);
    setSurvivedDays(prev => prev + 1);
    setJournalEntries(prev => [...prev, `Ночь дня ${day}: День прошёл. Все живы. ${peopleInHouse.length >= 2 ? 'Вы не одиноки.' : 'Ты один...'}`]);
    
    setTimeout(() => {
      const randomWarning = nakedGuestMessages[Math.floor(Math.random() * nakedGuestMessages.length)];
      setNakedGuestWarnings([randomWarning]);
      setGameState('naked-guest');
      playSound('knock');
    }, 1000);
  };

  const continueAfterNakedGuest = () => {
    if (peopleInHouse.length < 2) {
      setGameState('death');
      setDeathDialogueIndex(0);
      playSound('scream');
      return;
    }
    
    const hasStranger = peopleInHouse.some(p => p.isStranger);
    setCurrentArrival(hasStranger ? generatePerson() : (day <= 7 && Math.random() > 0.5 ? generatePerson(true) : generatePerson()));
    setGameState('arrival');
    setTimeout(() => playSound('knock'), 500);
  };

  const continueDeathDialogue = () => {
    playSound('click');
    if (deathDialogueIndex < deathDialogue.length - 1) {
      setDeathDialogueIndex(prev => prev + 1);
    } else {
      setGameState('alone');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {gameState === 'menu' && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-card">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-primary animate-flicker">No, I'm not a human</h1>
              <p className="text-xl text-muted-foreground">Хоррор на выживание</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
                Паразиты-инопланетяне проникают через уши замёрзших людей. 
                Общайтесь, проверяйте, выживайте. Но не оставайтесь одни...
              </p>
            </div>
            
            <div className="space-y-4 max-w-md mx-auto px-4">
              <Button 
                onClick={startGame}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary"
                size="lg"
              >
                Начать игру
              </Button>
              
              <Button 
                onClick={() => {
                  playSound('click');
                  setGameState('kcs');
                }}
                variant="outline"
                className="w-full border-2"
                size="lg"
              >
                База знаний КЧС
              </Button>

              <Button 
                onClick={() => {
                  playSound('click');
                  setGameState('journal');
                }}
                variant="outline"
                className="w-full border-2"
                size="lg"
              >
                Журнал событий
              </Button>
            </div>

            {survivedDays > 0 && (
              <div className="text-muted-foreground">
                <p>Последняя попытка: {survivedDays} {survivedDays === 1 ? 'день' : 'дней'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'arrival' && currentArrival && (
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setGameState('menu')}
                className="border-2"
              >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                Меню
              </Button>
              
              <Badge variant="outline" className="text-lg px-4 py-2">
                <Icon name="Calendar" className="mr-2" size={16} />
                День {day}
              </Badge>

              <Button 
                variant="outline" 
                onClick={() => setGameState('kcs')}
                className="border-2"
              >
                <Icon name="BookOpen" className="mr-2" size={16} />
                КЧС
              </Button>
            </div>

            <Alert className="border-primary/50">
              <Icon name="Users" className="h-4 w-4" />
              <AlertDescription>
                В доме: {peopleInHouse.length} {peopleInHouse.length === 1 ? 'человек' : 'человека'}
                {peopleInHouse.length === 0 && ' — ОПАСНО! Одному оставаться нельзя!'}
              </AlertDescription>
            </Alert>

            <Card className="p-8 bg-card border-2 animate-fade-in">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <Icon name="DoorOpen" className="mx-auto text-primary animate-pulse-danger" size={64} />
                  <h2 className="text-3xl font-bold">Стук в дверь</h2>
                  <div className="text-6xl">{currentArrival.avatar}</div>
                  <h3 className="text-2xl">{currentArrival.name}</h3>
                  <p className="text-muted-foreground italic">
                    "Пустите! На улице смертельный холод! Прошу вас!"
                  </p>
                </div>

                <div className="bg-secondary/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    <Icon name="Info" className="inline mr-2" size={16} />
                    Проверить можно только ПОСЛЕ того, как впустите
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={startDoorDialogue}
                    className="flex-1 bg-primary hover:bg-primary/90 border-2 border-primary"
                    size="lg"
                  >
                    <Icon name="MessageCircle" className="mr-2" size={20} />
                    Поговорить
                  </Button>
                  <Button 
                    onClick={letPersonIn}
                    variant="outline"
                    className="flex-1 border-2"
                    size="lg"
                  >
                    <Icon name="DoorOpen" className="mr-2" size={20} />
                    Впустить
                  </Button>
                  <Button 
                    onClick={denyPerson}
                    variant="outline"
                    className="flex-1 border-2"
                    size="lg"
                  >
                    <Icon name="DoorClosed" className="mr-2" size={20} />
                    Отказать
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'house' && (
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setGameState('menu')}
                className="border-2"
              >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                Меню
              </Button>
              
              <Badge variant="outline" className="text-lg px-4 py-2">
                <Icon name="Calendar" className="mr-2" size={16} />
                День {day}
              </Badge>

              <Button 
                variant="outline" 
                onClick={() => setGameState('kcs')}
                className="border-2"
              >
                <Icon name="BookOpen" className="mr-2" size={16} />
                КЧС
              </Button>
            </div>

            {aloneWarning && (
              <Alert variant="destructive" className="animate-pulse-danger">
                <Icon name="AlertTriangle" className="h-4 w-4" />
                <AlertDescription>
                  ОПАСНО! Вы остались один. Гости придут ночью...
                </AlertDescription>
              </Alert>
            )}

            <Card className="p-6 bg-card border-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    <Icon name="Home" className="inline mr-2" size={24} />
                    В доме
                  </h2>
                  <Badge variant="outline">
                    Людей: {peopleInHouse.length}
                  </Badge>
                </div>

                {peopleInHouse.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="Users" className="mx-auto mb-4 opacity-50" size={48} />
                    <p>В доме никого нет</p>
                    <p className="text-sm mt-2 text-destructive">Одному оставаться опасно!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {peopleInHouse.map((person) => (
                      <Card key={person.id} className="p-4 bg-secondary/50">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">{person.avatar}</div>
                              <div>
                                <h3 className="font-semibold">{person.name}</h3>
                                {person.isStranger && (
                                  <Badge variant="secondary" className="text-xs">
                                    Неизвестен
                                  </Badge>
                                )}
                                {person.wasChecked && !person.isStranger && (
                                  <Badge variant="default" className="text-xs">
                                    Проверен
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button 
                            onClick={() => startInspection(person)}
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            <Icon name="Search" className="mr-1" size={14} />
                            {person.wasChecked ? 'Проверить снова' : 'Проверить'}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={lookOutWindow}
                    variant="outline"
                    className="border-2"
                    size="lg"
                  >
                    <Icon name="Eye" className="mr-2" size={20} />
                    Окно
                  </Button>
                  
                  <Button 
                    onClick={checkSelf}
                    variant="outline"
                    className="border-2"
                    size="lg"
                  >
                    <Icon name="User" className="mr-2" size={20} />
                    Себя
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => {
                      playSound('click');
                      setGameState('tv');
                    }}
                    variant="outline"
                    className="border-2"
                    size="lg"
                  >
                    <Icon name="Tv" className="mr-2" size={20} />
                    Телевизор
                  </Button>
                  
                  <Button 
                    onClick={endDay}
                    className="bg-primary hover:bg-primary/90 border-2 border-primary"
                    size="lg"
                  >
                    <Icon name="Moon" className="mr-2" size={20} />
                    День
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'inspection' && selectedPerson && (
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={finishInspection}
                className="border-2"
              >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                Вернуться
              </Button>
              
              <h2 className="text-2xl font-bold">Проверка: {selectedPerson.name}</h2>

              <Button 
                variant="destructive" 
                onClick={shootPerson}
                className="border-2"
              >
                <Icon name="Skull" className="mr-2" size={16} />
                Застрелить
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card border-2">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-8xl mb-4">{selectedPerson.avatar}</div>
                    <h3 className="text-2xl font-bold">{selectedPerson.name}</h3>
                    {selectedPerson.isStranger && (
                      <Badge variant="secondary" className="mt-2">
                        Нельзя проверить
                      </Badge>
                    )}
                  </div>

                  <Button 
                    onClick={talkToPerson}
                    className="w-full bg-primary"
                    size="lg"
                  >
                    <Icon name="MessageCircle" className="mr-2" size={20} />
                    Поговорить
                  </Button>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Физическая проверка:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {guestTraits.slice(0, 6).map((trait) => (
                        <Button
                          key={trait.id}
                          onClick={() => checkTrait(trait.name)}
                          variant={discoveredTraits.includes(trait.name) ? "secondary" : "outline"}
                          size="sm"
                          className="text-xs"
                          disabled={discoveredTraits.includes(trait.name)}
                        >
                          <Icon name={trait.icon as any} className="mr-1" size={12} />
                          {trait.check}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border-2">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center">
                    <Icon name="ClipboardList" className="mr-2" size={20} />
                    Результаты проверки
                  </h3>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {chatHistory.map((msg, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg ${
                            msg.sender === 'system' 
                              ? 'bg-secondary/50 text-sm' 
                              : 'bg-primary/10'
                          }`}
                        >
                          <p className="font-semibold text-xs text-muted-foreground">{msg.sender}</p>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {discoveredTraits.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Подозрительные признаки:</p>
                      <div className="flex flex-wrap gap-2">
                        {discoveredTraits.filter(t => selectedPerson.suspiciousTraits.includes(t)).map((trait, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                      {discoveredTraits.filter(t => selectedPerson.suspiciousTraits.includes(t)).length === 0 && (
                        <p className="text-sm text-muted-foreground">Пока не обнаружено</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {gameState === 'door-dialogue' && currentArrival && (
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setChatHistory([]);
                  setGameState('arrival');
                }}
                className="border-2"
              >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                Назад
              </Button>
              
              <h2 className="text-2xl font-bold">Разговор у двери: {currentArrival.name}</h2>
              
              <div className="w-24"></div>
            </div>

            <Card className="p-6 bg-card border-2">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Icon name="DoorClosed" className="mx-auto mb-2 text-primary" size={48} />
                  <div className="text-6xl mb-2">{currentArrival.avatar}</div>
                  <h3 className="text-xl font-bold">{currentArrival.name}</h3>
                  <p className="text-sm text-muted-foreground">За дверью</p>
                </div>

                <ScrollArea className="h-[400px] border rounded-lg p-4 bg-secondary/20">
                  <div className="space-y-3">
                    {chatHistory.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.sender === 'Вы' 
                            ? 'bg-primary/20 ml-8' 
                            : 'bg-card mr-8'
                        }`}
                      >
                        <p className="font-semibold text-xs text-muted-foreground mb-1">{msg.sender}</p>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Спросите что-нибудь через дверь..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendDoorMessage();
                      }
                    }}
                  />
                  <Button onClick={sendDoorMessage} size="lg">
                    <Icon name="Send" size={20} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {dialogues.doorResponses.map((response, idx) => (
                    <Button
                      key={idx}
                      onClick={() => {
                        setUserMessage(response);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {response}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={letPersonIn}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    <Icon name="DoorOpen" className="mr-2" size={20} />
                    Впустить
                  </Button>
                  <Button 
                    onClick={denyPerson}
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                  >
                    <Icon name="DoorClosed" className="mr-2" size={20} />
                    Отказать
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'dialogue' && selectedPerson && (
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setGameState('inspection')}
                className="border-2"
              >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                К проверке
              </Button>
              
              <h2 className="text-2xl font-bold">Разговор: {selectedPerson.name}</h2>
              
              <div className="w-24"></div>
            </div>

            <Card className="p-6 bg-card border-2">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">{selectedPerson.avatar}</div>
                  <h3 className="text-xl font-bold">{selectedPerson.name}</h3>
                  {selectedPerson.isStranger && selectedPerson.strangerStory && (
                    <div className="mt-4 p-4 bg-secondary/50 rounded-lg text-sm text-left">
                      <p className="font-semibold mb-2 flex items-center">
                        <Icon name="BookOpen" className="mr-2" size={16} />
                        История Незнакомца:
                      </p>
                      <p className="text-muted-foreground italic">{selectedPerson.strangerStory}</p>
                    </div>
                  )}
                </div>

                <ScrollArea className="h-[400px] border rounded-lg p-4 bg-secondary/20">
                  <div className="space-y-3">
                    {chatHistory.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.sender === 'Вы' 
                            ? 'bg-primary/20 ml-8' 
                            : 'bg-card mr-8'
                        }`}
                      >
                        <p className="font-semibold text-xs text-muted-foreground mb-1">{msg.sender}</p>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Введите ваш вопрос..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage} size="lg">
                    <Icon name="Send" size={20} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {dialogues.responses.map((response, idx) => (
                    <Button
                      key={idx}
                      onClick={() => {
                        setUserMessage(response);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {response}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'kcs' && (
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setGameState(currentArrival ? 'arrival' : peopleInHouse.length > 0 ? 'house' : 'menu')}
                className="border-2"
              >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                Назад
              </Button>
              <h1 className="text-3xl font-bold">База знаний КЧС</h1>
              <div className="w-24"></div>
            </div>

            <Card className="p-6 bg-card border-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold flex items-center">
                    <Icon name="Shield" className="mr-2 text-primary" size={24} />
                    Комитет по Чрезвычайным Ситуациям
                  </h2>
                  <Alert>
                    <Icon name="Bug" className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Паразит-инопланетянин:</strong> Проникает в мозг через ухо замёрзших людей. 
                      Заражённые постепенно теряют контроль, впадают в безумие и убивают всех вокруг.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {guestTraits.map((trait) => (
                    <Card key={trait.id} className="p-4 bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex items-start gap-3">
                        <Icon name={trait.icon as any} className="text-primary mt-1" size={20} />
                        <div className="space-y-1">
                          <h3 className="font-semibold">{trait.name}</h3>
                          <p className="text-sm text-muted-foreground">{trait.description}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {trait.check}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'journal' && (
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setGameState('menu')}
                className="border-2"
              >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                Назад
              </Button>
              <h1 className="text-3xl font-bold">Журнал событий</h1>
              <div className="w-24"></div>
            </div>

            <Card className="p-6 bg-card border-2">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {journalEntries.map((entry, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                      <p className="text-sm text-muted-foreground">Запись #{idx + 1}</p>
                      <p>{entry}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'window' && (
        <div className="min-h-screen p-4 bg-black/90">
          <div className="max-w-4xl mx-auto space-y-6 pt-20">
            <Card className="p-8 bg-card border-4 border-destructive animate-pulse-danger">
              <div className="space-y-6 text-center">
                <h2 className="text-3xl font-bold text-destructive">🪟 Смотришь в окно</h2>
                
                <div className="bg-black/70 p-6 rounded-lg space-y-4">
                  <p className="text-lg text-muted-foreground italic">
                    {streetDescription}
                  </p>
                </div>

                {nakedGuestWarnings.length > 0 && (
                  <div className="bg-destructive/20 p-6 rounded-lg border-2 border-destructive">
                    <div className="text-8xl animate-flicker mb-4">👹</div>
                    {nakedGuestWarnings.map((warning, idx) => (
                      <p key={idx} className="text-xl text-destructive italic animate-fade-in">
                        "{warning}"
                      </p>
                    ))}
                  </div>
                )}

                {peopleInHouse.length < 2 && (
                  <Alert variant="destructive" className="animate-pulse">
                    <Icon name="AlertTriangle" className="h-4 w-4" />
                    <AlertDescription>
                      ОПАСНО! В доме меньше 2 человек! Голый Гость сейчас ворвётся!
                    </AlertDescription>
                  </Alert>
                )}
                <Button 
                  onClick={() => {
                    setGameState('house');
                    playSound('ambient');
                  }}
                  className="bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Отойти от окна
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'naked-guest' && (
        <div className="min-h-screen p-4 bg-black">
          <div className="max-w-4xl mx-auto space-y-6 pt-20">
            <Card className="p-8 bg-destructive/20 border-4 border-destructive">
              <div className="space-y-6 text-center">
                <div className="relative">
                  <img 
                    src="https://cdn.poehali.dev/files/d835ed1c-256a-4e6d-a355-0f19b135a5d8.jpg" 
                    alt="Голый Гость"
                    className="w-full max-w-md mx-auto rounded-lg border-4 border-cyan-500 animate-pulse-danger"
                  />
                </div>
                <h2 className="text-4xl font-bold text-cyan-400 animate-flicker">ГОЛЫЙ ГОСТЬ!</h2>
                <div className="bg-black/70 p-6 rounded-lg space-y-4">
                  {nakedGuestWarnings.map((warning, idx) => (
                    <p key={idx} className="text-2xl text-cyan-300 font-bold animate-pulse-danger">
                      "{warning}"
                    </p>
                  ))}
                  {peopleInHouse.length < 2 && (
                    <p className="text-3xl text-destructive font-bold mt-6 animate-flicker">
                      *ЗВУК ЛОМАЮЩЕЙСЯ ДВЕРИ*
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => {
                    continueAfterNakedGuest();
                    playSound('tension');
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  size="lg"
                >
                  {peopleInHouse.length < 2 ? 'Он ворвался...' : 'Он ушёл... пока...'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'death' && (
        <div className="min-h-screen p-4 bg-black">
          <div className="max-w-4xl mx-auto flex items-center justify-center min-h-screen">
            <Card className="p-12 bg-black border-4 border-destructive">
              <div className="space-y-8 text-center">
                <div className="text-9xl">💀</div>
                <div className="space-y-6">
                  <p className="text-4xl text-destructive font-bold animate-fade-in">
                    {deathDialogue[deathDialogueIndex]}
                  </p>
                </div>
                <Button 
                  onClick={continueDeathDialogue}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  size="lg"
                >
                  {deathDialogueIndex < deathDialogue.length - 1 ? '...' : 'Принять судьбу'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'alone' && (
        <div className="min-h-screen p-4 bg-gradient-to-b from-green-900 to-green-700">
          <div className="max-w-4xl mx-auto flex items-center justify-center min-h-screen">
            <Card className="p-12 bg-green-100 border-4 border-green-300">
              <div className="space-y-8 text-center">
                <div className="text-8xl">🏡</div>
                <h2 className="text-4xl font-bold text-green-900">Покой</h2>
                <div className="space-y-4 text-green-800">
                  <p className="text-2xl">
                    Ты в своём доме
                  </p>
                  <p className="text-xl">
                    Вокруг зелёный луг. Тепло. Светло.
                  </p>
                  <p className="text-xl">
                    Птицы поют. Ветер шепчет в траве.
                  </p>
                  <p className="text-2xl font-bold">
                    Ты обрёл покой.
                  </p>
                  <p className="text-lg italic">
                    Больше нет холода. Нет страха.
                  </p>
                  <p className="text-lg">
                    Здесь тихо и спокойно...
                  </p>
                  <p className="text-xl font-semibold">
                    Навсегда.
                  </p>
                </div>
                <div className="pt-8">
                  <Button 
                    onClick={() => setGameState('menu')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    Вернуться в меню
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'self-check' && (
        <div className="min-h-screen p-4 bg-black/90">
          <div className="max-w-4xl mx-auto flex items-center justify-center min-h-screen">
            <Card className={`p-12 border-4 ${playerInfected ? 'bg-destructive/20 border-destructive' : 'bg-card border-primary'}`}>
              <div className="space-y-8 text-center">
                {playerInfected ? (
                  <>
                    <div className="text-9xl animate-shake">🧟</div>
                    <h2 className="text-4xl font-bold text-destructive animate-flicker">ТЫ ЗАРАЖЁН</h2>
                    <div className="bg-black/70 p-6 rounded-lg space-y-4">
                      <p className="text-2xl text-destructive">
                        Паразит внутри тебя...
                      </p>
                      <p className="text-xl text-destructive">
                        Ты убил {innocentKills} невинных людей
                      </p>
                      <p className="text-lg text-muted-foreground italic">
                        Скоро ты потеряешь контроль...
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-8xl">👤</div>
                    <h2 className="text-3xl font-bold">Проверка себя</h2>
                    <div className="bg-secondary/50 p-6 rounded-lg space-y-4">
                      <p className="text-xl text-primary">✓ Движения нормальные</p>
                      <p className="text-xl text-primary">✓ Дыхание ровное</p>
                      <p className="text-xl text-primary">✓ Сознание ясное</p>
                      <p className="text-xl text-primary">✓ Температура тела в норме</p>
                    </div>
                    <p className="text-lg text-muted-foreground">
                      Ты пока не заражён
                    </p>
                    {innocentKills > 0 && (
                      <Alert variant="destructive">
                        <Icon name="AlertTriangle" className="h-4 w-4" />
                        <AlertDescription>
                          Ты убил {innocentKills} невинных! Ещё {2 - innocentKills} и паразит проникнет в тебя!
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
                <Button 
                  onClick={() => setGameState('house')}
                  variant={playerInfected ? "destructive" : "default"}
                  size="lg"
                >
                  Назад
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'player-infected' && (
        <div className="min-h-screen p-4 bg-black">
          <div className="max-w-4xl mx-auto flex items-center justify-center min-h-screen">
            <Card className="p-12 bg-destructive/20 border-4 border-destructive">
              <div className="space-y-8 text-center">
                <div className="text-9xl animate-shake">🧟</div>
                <div className="space-y-6">
                  <p className="text-3xl text-destructive font-bold animate-fade-in">
                    {infectionCutscene[infectionCutsceneStep]}
                  </p>
                  {infectionCutsceneStep >= 4 && (
                    <div className="text-6xl animate-flicker">
                      🔪💀🩸
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => {
                    continueInfectionCutscene();
                    playSound('tension');
                  }}
                  variant="destructive"
                  size="lg"
                >
                  {infectionCutsceneStep < infectionCutscene.length - 1 ? '...' : 'Конец'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {gameState === 'tv' && (
        <div className="min-h-screen p-4 bg-black">
          <div className="max-w-4xl mx-auto space-y-6 pt-20">
            <Card className="p-8 bg-gray-900 border-4 border-gray-700">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-gray-300">
                    <Icon name="Tv" className="inline mr-2" size={32} />
                    Телевизор
                  </h2>
                  <Button 
                    onClick={() => {
                      setGameState('house');
                      playSound('click');
                    }}
                    variant="outline"
                  >
                    Выключить
                  </Button>
                </div>

                <div className="bg-black p-6 rounded-lg border-4 border-blue-500">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-blue-400 mb-4">📡 ЭКСТРЕННЫЕ НОВОСТИ</h3>
                    </div>
                    
                    {tvNews.slice(0, Math.min(day, tvNews.length)).map((news, idx) => (
                      <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
                        <p className="text-lg text-gray-300">{news}</p>
                      </div>
                    ))}

                    <div className="mt-6 p-4 bg-red-900/50 border-2 border-red-500 rounded">
                      <p className="text-xl text-red-300 font-bold text-center animate-pulse">
                        ⚠️ ОСТАВАЙТЕСЬ ДОМА. НЕ ДОВЕРЯЙТЕ НЕЗНАКОМЦАМ. ⚠️
                      </p>
                    </div>

                    <div className="mt-8 space-y-3">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold text-yellow-400">⭐ РЕКЛАМА ⭐</h4>
                      </div>
                      {tvAds.slice(0, Math.min(Math.floor(day / 2) + 1, tvAds.length)).map((ad, idx) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-600 rounded">
                          <p className="text-base text-yellow-200">{ad}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center text-gray-500 text-sm">
                  День {day} • Трансляция от Центра по контролю аномалий
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;