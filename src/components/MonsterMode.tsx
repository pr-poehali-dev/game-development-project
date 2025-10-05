import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Person {
  id: number;
  name: string;
  avatar: string;
  alive: boolean;
  suspicion: number;
}

interface MonsterModeProps {
  onExit: () => void;
  playSound: (type: string) => void;
}

const MonsterMode = ({ onExit, playSound }: MonsterModeProps) => {
  const [screen, setScreen] = useState<'intro' | 'walking' | 'door' | 'inside' | 'talk' | 'check' | 'kill' | 'ending'>('intro');
  const [introStep, setIntroStep] = useState(0);
  const [madness, setMadness] = useState(0);
  const [suspicion, setSuspicion] = useState(0);
  const [victims, setVictims] = useState<{name: string, avatar: string}[]>([]);
  const [housePeople, setHousePeople] = useState<Person[]>([]);
  const [currentNPC, setCurrentNPC] = useState<Person | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<{role: 'player' | 'npc' | 'parasite', text: string}[]>([]);
  const [playerMessage, setPlayerMessage] = useState('');
  const [parasiteMessages, setParasiteMessages] = useState<string[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const [checksUsed, setChecksUsed] = useState<string[]>([]);
  const [endingType, setEndingType] = useState<'killed-all' | 'died' | 'freed' | null>(null);
  const [deathStep, setDeathStep] = useState(0);
  const [killsToday, setKillsToday] = useState(0);
  const [dayNumber, setDayNumber] = useState(1);
  const [hunger, setHunger] = useState(0);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [relationships, setRelationships] = useState<{[key: number]: number}>({});

  const parasiteVoices = [
    "...убей их...",
    "...они враги...",
    "...кровь... нужна кровь...",
    "...не доверяй им...",
    "...ты не человек...",
    "...сделай это сейчас...",
    "...голоса... так много голосов...",
    "...я внутри тебя...",
    "...мы — одно...",
    "...не сопротивляйся...",
    "...я голоден...",
    "...накорми меня...",
    "...ты слабеешь...",
    "...они знают...",
    "...беги...",
    "...прячься...",
    "...ты уже мёртв..."
  ];

  const randomEvents = [
    { type: 'sound', text: 'Ты слышишь странный звук за стеной...', suspicionAdd: 5 },
    { type: 'mirror', text: 'Ты случайно смотришь в зеркало. Твоё отражение улыбается, хотя ты этого не делаешь.', madnessAdd: 10 },
    { type: 'blood', text: 'Из носа идёт кровь. Ты вытираешь её, надеясь что никто не видел.', suspicionAdd: 15 },
    { type: 'twitch', text: 'Твоя рука дёргается сама по себе. Паразит становится сильнее.', madnessAdd: 8 },
    { type: 'whisper', text: 'Люди шепчутся за твоей спиной...', suspicionAdd: 10 },
    { type: 'dream', text: 'Ты помнишь сон... Там ты был монстром. Или это не сон?', madnessAdd: 12 },
    { type: 'food', text: 'Паразит требует пищи. Голод усиливается...', hungerAdd: 20 },
  ];

  const startGame = () => {
    const people: Person[] = [
      { id: 1, name: 'Иван', avatar: '👨', alive: true, suspicion: 0 },
      { id: 2, name: 'Мария', avatar: '👩', alive: true, suspicion: 0 },
      { id: 3, name: 'Дедушка Пётр', avatar: '👴', alive: true, suspicion: 0 },
      { id: 4, name: 'Лена', avatar: '👧', alive: true, suspicion: 0 }
    ];
    setHousePeople(people);
    setScreen('walking');
  };

  const addParasiteMessage = () => {
    const msg = parasiteVoices[Math.floor(Math.random() * parasiteVoices.length)];
    setParasiteMessages(prev => [...prev.slice(-2), msg]);
    setMadness(prev => Math.min(100, prev + 5));
  };

  const generateSmartReply = (msg: string, npc: Person): { reply: string, suspicion: number } => {
    const lowerMsg = msg.toLowerCase();
    const msgLength = msg.length;
    
    const nervousWords = ['пожалуйста', 'умоляю', 'помогите', 'замерзаю', 'холодно', 'простите', 'извините'];
    const strangeWords = ['паразит', 'убить', 'кровь', 'голоса', 'мозг', 'они', 'следят', 'контролируют'];
    const politeWords = ['здравствуйте', 'добрый', 'спасибо', 'благодарю', 'будьте добры'];
    const aggressiveWords = ['быстро', 'открывай', 'немедленно', 'сейчас же', 'давай'];
    const questionWords = ['можно', 'разрешите', 'позвольте', 'могу ли'];
    
    const hasNervous = nervousWords.some(w => lowerMsg.includes(w));
    const hasStrange = strangeWords.some(w => lowerMsg.includes(w));
    const hasPolite = politeWords.some(w => lowerMsg.includes(w));
    const hasAggressive = aggressiveWords.some(w => lowerMsg.includes(w));
    const hasQuestion = questionWords.some(w => lowerMsg.includes(w));
    const isShort = msgLength < 15;
    const hasQuestionMark = msg.includes('?');
    
    let suspicionAdd = 0;
    let replyPool: string[] = [];
    
    if (hasStrange) {
      return {
        reply: Math.random() > 0.5 
          ? "ЧТО?! Ты о чём вообще?! *хватается за оружие*" 
          : "Ты... ты заражён! УБИРАЙСЯ ОТСЮДА!",
        suspicion: 100
      };
    }
    
    if (npc.suspicion > 80) {
      replyPool = [
        `*${npc.name} направляет на тебя дробовик* Последний раз спрашиваю — КТО ТЫ?!`,
        "Хватит болтать! Ты слишком странный. Уходи, пока жив!",
        "*щёлкает затвором* Ещё одно неверное слово...",
        "Я тебя насквозь вижу. Ты не человек. ПОШЁЛ ВОН!"
      ];
      suspicionAdd = 15;
    } else if (npc.suspicion > 60) {
      if (hasNervous) {
        replyPool = [
          "Почему ты так нервничаешь? У нормальных людей руки не трясутся!",
          "*прищуривается* Умоляешь? Заражённые всегда умоляют...",
          "Холодно, говоришь? А почему ты весь потный тогда?",
          "Помогите... помогите... Знаю я эти штучки. Покажи шею!"
        ];
        suspicionAdd = 25;
      } else if (hasAggressive) {
        replyPool = [
          "Ты мне приказываешь?! *хватается за биту* Попробуй ещё раз!",
          "Быстро? БЫСТРО?! Да кто ты такой вообще?!",
          "*отступает назад* Агрессия — первый признак заражения!"
        ];
        suspicionAdd = 30;
      } else {
        replyPool = [
          "*не спускает с тебя глаз* Отвечай чётко — что тебе нужно?",
          "Стой там, где стоишь. Не. Двигайся.",
          "*поднимает фонарь к твоему лицу* Дай-ка я посмотрю на твои глаза...",
          "Руки на виду! И говори медленно."
        ];
        suspicionAdd = 15;
      }
    } else if (npc.suspicion > 40) {
      if (hasPolite) {
        replyPool = [
          "Вежливый какой... Слишком вежливый. Что-то тут не так.",
          "Хм. Благодарит меня... *недоверчиво* Ладно, говори дальше.",
          "*чуть расслабляется* Ну хоть манеры есть. Чего надо?"
        ];
        suspicionAdd = 5;
      } else if (isShort) {
        replyPool = [
          "Что 'да'? Что 'нет'? Отвечай нормально!",
          "*раздражённо* Ты что, говорить разучился?",
          "Короткие ответы — плохой знак. Объясняй подробнее!"
        ];
        suspicionAdd = 15;
      } else if (hasQuestion) {
        replyPool = [
          "Можно... *усмехается* А если я скажу 'нельзя'?",
          "Спрашиваешь разрешения? Это подозрительно вежливо...",
          "*качает головой* Сначала ответь на МОИ вопросы."
        ];
        suspicionAdd = 10;
      } else {
        replyPool = [
          "Хм... *смотрит с подозрением* И почему я должен тебе верить?",
          "*скрещивает руки* Продолжай. Я слушаю.",
          "Звучит странно, но... ладно. Что дальше?"
        ];
        suspicionAdd = 8;
      }
    } else if (npc.suspicion > 20) {
      if (hasNervous) {
        replyPool = [
          "Эй, успокойся. Почему ты так дёргаешься?",
          "*нахмурился* Замерзаешь, говоришь? А руки почему трясутся?",
          "Умоляешь меня? *настораживается* Что ты натворил?"
        ];
        suspicionAdd = 12;
      } else if (hasPolite && hasQuestion) {
        replyPool = [
          "*чуть кивает* Ну... спрашиваешь культурно. Слушаю тебя.",
          `${npc.name} смотрит на тебя внимательно, но без агрессии. — Ладно, говори.`,
          "*опускает оружие, но держит наготове* Хорошо. Объясняй."
        ];
        suspicionAdd = 3;
      } else {
        replyPool = [
          "Понятно... *почесывает затылок* И что мне с этим делать?",
          "*пожимает плечами* Ну ладно. Продолжай.",
          "Хм. А почему ты именно в МОЙ дом стучишься?"
        ];
        suspicionAdd = 7;
      }
    } else {
      if (hasPolite) {
        replyPool = [
          "*расслабленно* О, нормальный человек! Уже редкость. Слушаю.",
          `${npc.name} улыбается. — Давно не встречал вежливых людей. Заходи.`,
          "*опускает оружие* Хорошо, хорошо. Рассказывай."
        ];
        suspicionAdd = 0;
      } else if (hasQuestion) {
        replyPool = [
          "Можно, конечно... Но сначала скажи — ты не укушен?",
          "*кивает* Да, но осторожно. Времена сейчас такие...",
          "Хорошо. Но быстро, ладно? Мне ещё дверь баррикадировать."
        ];
        suspicionAdd = 5;
      } else {
        replyPool = [
          "*кивает* Понял. Ладно.",
          `${npc.name} чешет подбородок. — Интересно. Что ещё?`,
          "Окей... *смотрит в окно* Это всё?",
          "Хм. Ну что ж... *расслабленно вздыхает*"
        ];
        suspicionAdd = 4;
      }
    }
    
    if (hasNervous) suspicionAdd += 8;
    if (hasAggressive) suspicionAdd += 12;
    if (isShort && !hasQuestion) suspicionAdd += 5;
    if (!hasQuestionMark && !hasPolite && msgLength > 50) suspicionAdd -= 3;
    
    return {
      reply: replyPool[Math.floor(Math.random() * replyPool.length)],
      suspicion: Math.max(0, suspicionAdd)
    };
  };

  const sendMessage = async () => {
    if (!playerMessage.trim() || !currentNPC) return;
    
    setDialogueHistory(prev => [...prev, { role: 'player', text: playerMessage }]);
    setIsAITyping(true);
    
    const aiResponse = generateSmartReply(playerMessage, currentNPC);
    const npcReply = aiResponse.reply;
    const suspicionIncrease = aiResponse.suspicion;
    
    setDialogueHistory(prev => [...prev, { role: 'npc', text: npcReply }]);
    setSuspicion(prev => Math.min(100, prev + suspicionIncrease));
    
    setHousePeople(prev => prev.map(p => 
      p.id === currentNPC.id 
        ? { ...p, suspicion: Math.min(100, p.suspicion + suspicionIncrease) }
        : p
    ));
    
    if (Math.random() > 0.7) addParasiteMessage();
    
    if (Math.random() > 0.6 && currentNPC.suspicion > 30) {
      const checkMessages = [
        "— Дай-ка я посмотрю на твои руки... *щупает* Холодные какие-то...",
        "— Ты странно дышишь. Ты точно в порядке?",
        "— Глаза у тебя какие-то стеклянные... Ты не заражён?",
        "— Двигаешься как-то резко... Покажись на свету.",
        "— А ну встань сюда, к зеркалу. Хочу проверить кое-что.",
        "— Что-то от тебя странно пахнет... Ты точно человек?"
      ];
      const checkMsg = checkMessages[Math.floor(Math.random() * checkMessages.length)];
      setDialogueHistory(prev => [...prev, { role: 'npc', text: checkMsg }]);
      
      setHousePeople(prev => prev.map(p => 
        p.id === currentNPC.id 
          ? { ...p, suspicion: Math.min(100, p.suspicion + 15) }
          : p
      ));
      setSuspicion(prev => Math.min(100, prev + 15));
    }
    
    setPlayerMessage('');
    setIsAITyping(false);
  };

  const killPerson = (person: Person) => {
    playSound('scream');
    setVictims(prev => [...prev, { name: person.name, avatar: person.avatar }]);
    setHousePeople(prev => prev.map(p => {
      if (p.id === person.id) {
        return { ...p, alive: false };
      }
      return { ...p, suspicion: Math.min(100, p.suspicion + 40) };
    }));
    setMadness(prev => Math.max(0, prev - 15));
    setHunger(prev => Math.max(0, prev - 50));
    setKillsToday(prev => prev + 1);
    
    const possibleLoots = [
      { item: '🔑 Ключ от подвала', chance: 0.3 },
      { item: '📱 Телефон (разряжен)', chance: 0.4 },
      { item: '💊 Таблетки от головной боли', chance: 0.6 },
      { item: '🔦 Фонарик', chance: 0.5 },
      { item: '🗝️ Странный ключ', chance: 0.2 },
    ];
    
    possibleLoots.forEach(loot => {
      if (Math.random() < loot.chance) {
        setInventory(prev => [...prev, loot.item]);
        setDiscoveries(prev => [...prev, `Найден предмет: ${loot.item}`]);
      }
    });
    
    addParasiteMessage();
    
    const aliveCount = housePeople.filter(p => p.alive && p.id !== person.id).length;
    
    if (aliveCount === 0) {
      setEndingType('killed-all');
      setScreen('ending');
    } else {
      setScreen('inside');
    }
  };

  const triggerRandomEvent = () => {
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    setDiscoveries(prev => [...prev, event.text]);
    if (event.suspicionAdd) setSuspicion(prev => Math.min(100, prev + event.suspicionAdd));
    if (event.madnessAdd) setMadness(prev => Math.min(100, prev + event.madnessAdd));
    if (event.hungerAdd) setHunger(prev => Math.min(100, prev + event.hungerAdd));
  };

  const useItem = (item: string) => {
    if (item.includes('Таблетки')) {
      setMadness(prev => Math.max(0, prev - 20));
      setInventory(prev => prev.filter(i => i !== item));
      setDiscoveries(prev => [...prev, '💊 Принял таблетки. Голоса стихли...']);
    } else if (item.includes('Фонарик')) {
      setSuspicion(prev => Math.max(0, prev - 15));
      setInventory(prev => prev.filter(i => i !== item));
      setDiscoveries(prev => [...prev, '🔦 Осветил себя. Люди успокоились.']);
    }
  };

  const introSteps = [
    {
      emoji: '❄️',
      title: 'Мороз',
      text: 'Температура -40°C. Ты бредёшь по улице.',
      subtext: 'Холод пронизывает до костей...'
    },
    {
      emoji: '😵',
      title: 'Обморожение',
      text: 'Ты падаешь в снег. Сознание плывёт.',
      subtext: 'Пальцы не чувствуешь. Глаза слипаются...'
    },
    {
      emoji: '🦠',
      title: 'Паразит',
      text: '*ЧТО-ТО* проникает в твоё ухо',
      subtext: 'Острая боль. Шёпот. Голоса...'
    },
    {
      emoji: '🧠',
      title: 'Контроль',
      text: '"...убей их всех..."',
      subtext: 'Ты больше не один в своей голове'
    }
  ];

  const deathSteps = [
    "Выстрел.",
    "Ты падаешь.",
    "Паразит пытается спасти тебя.",
    "Но уже поздно.",
    "Темнота.",
    "...",
    "Ты открываешь глаза.",
    "Ты в доме. В космосе.",
    "Здесь тепло. Светло.",
    "Окно — звёзды и планеты.",
    "На столе — чай. Книга.",
    "Смерть стоит рядом с тобой.",
    "— Привет, — говорит Смерть. — Ты умер.",
    "— Паразит больше не контролирует тебя.",
    "— Здесь ты в безопасности.",
    "— Это твой дом. Навсегда.",
    "Ты чувствуешь покой.",
    "Впервые за долгое время."
  ];

  if (screen === 'intro') {
    const step = introSteps[introStep];
    return (
      <div className="min-h-screen p-4 bg-black flex items-center justify-center">
        <Card className="p-12 bg-gradient-to-b from-card to-destructive/20 border-2 border-destructive max-w-2xl">
          <div className="space-y-8 text-center">
            <div className="text-9xl animate-pulse">{step.emoji}</div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-destructive">{step.title}</h2>
              <p className="text-2xl text-foreground">{step.text}</p>
              <p className="text-lg text-muted-foreground italic">"{step.subtext}"</p>
            </div>
            <Button 
              onClick={() => {
                if (introStep < introSteps.length - 1) {
                  setIntroStep(prev => prev + 1);
                  playSound('tension');
                  if (introStep === 2) addParasiteMessage();
                } else {
                  startGame();
                  playSound('footstep');
                }
              }}
              size="lg"
              variant="destructive"
              className="w-full text-xl"
            >
              {introStep < introSteps.length - 1 ? '...' : 'Начать'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (screen === 'walking') {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-black to-destructive/30">
        <div className="max-w-4xl mx-auto space-y-6 pt-8">
          <div className="flex justify-between items-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              🧠 Безумие: {madness}%
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              💀 Убито: {victims.length}
            </Badge>
          </div>

          {parasiteMessages.length > 0 && (
            <Alert className="border-destructive bg-destructive/20 animate-pulse">
              <Icon name="Brain" className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-destructive font-bold">
                {parasiteMessages[parasiteMessages.length - 1]}
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-7xl">🏠</div>
                <h2 className="text-3xl font-bold">Дом с горящим светом</h2>
                <p className="text-lg text-muted-foreground">
                  Ты видишь дом впереди. Внутри люди. Тепло. Жизнь...
                </p>
              </div>

              <div className="bg-secondary/30 p-6 rounded-lg space-y-3">
                <p className="text-foreground">
                  Паразит шепчет: <span className="text-destructive font-bold">"...войди... убей их..."</span>
                </p>
                <p className="text-muted-foreground">
                  Твоё тело движется само. Ты подходишь к двери.
                </p>
              </div>

              <Alert>
                <Icon name="Target" className="h-4 w-4" />
                <AlertDescription>
                  <strong>Твоя миссия:</strong> Проникнуть в дом и убить всех ({housePeople.length} человек)
                </AlertDescription>
              </Alert>

              <Button 
                onClick={() => {
                  setScreen('door');
                  playSound('knock');
                  addParasiteMessage();
                }}
                size="lg"
                className="w-full"
                variant="destructive"
              >
                Постучать в дверь
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'door') {
    const guardian = housePeople[0];
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto space-y-6 pt-8">
          <div className="flex justify-between items-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              🧠 Безумие: {madness}%
            </Badge>
            <Badge variant={suspicion > 50 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
              🔍 Подозрение: {suspicion}%
            </Badge>
          </div>

          {parasiteMessages.length > 0 && (
            <Alert className="border-destructive bg-destructive/20 animate-pulse">
              <Icon name="Brain" className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-destructive font-bold">
                {parasiteMessages[parasiteMessages.length - 1]}
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-7xl">🚪</div>
                <h2 className="text-3xl font-bold">Дверь</h2>
                <p className="text-muted-foreground italic">*ТУК-ТУК-ТУК*</p>
              </div>

              <div className="bg-secondary/30 p-6 rounded-lg space-y-3">
                <p className="text-foreground font-bold">
                  {guardian.avatar} {guardian.name}: "Кто там?!"
                </p>
                <p className="text-muted-foreground text-sm">
                  *Голос настороженный, но не агрессивный*
                </p>
              </div>

              <Alert className="border-destructive/50">
                <Icon name="AlertTriangle" className="h-4 w-4" />
                <AlertDescription>
                  Тебя могут проверить. Паразита можно обнаружить.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Textarea
                  placeholder="Что скажешь? (Напиши свой ответ)"
                  value={playerMessage}
                  onChange={(e) => setPlayerMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button 
                  onClick={() => {
                    if (!playerMessage.trim()) return;
                    
                    const nervous = ['помогите', 'умоляю', 'пожалуйста', 'замерзаю'];
                    const hasNervous = nervous.some(w => playerMessage.toLowerCase().includes(w));
                    
                    const strange = ['голоса', 'паразит', 'убить', 'кровь'];
                    const hasStrange = strange.some(w => playerMessage.toLowerCase().includes(w));
                    
                    if (hasStrange) {
                      setSuspicion(100);
                      setEndingType('died');
                      setScreen('ending');
                      playSound('gunshot');
                    } else {
                      setSuspicion(prev => Math.min(100, prev + (hasNervous ? 25 : 15)));
                      setCurrentNPC(guardian);
                      setScreen('inside');
                      playSound('door');
                      addParasiteMessage();
                    }
                    
                    setPlayerMessage('');
                  }}
                  disabled={!playerMessage.trim()}
                  size="lg"
                  className="w-full"
                >
                  Ответить
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'inside') {
    const alivePeople = housePeople.filter(p => p.alive);
    
    const randomCheck = Math.random() > 0.7;
    
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto space-y-6 pt-8">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              🧠 Безумие: {madness}%
            </Badge>
            <Badge variant={suspicion > 50 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
              🔍 Подозрение: {suspicion}%
            </Badge>
            <Badge variant={hunger > 70 ? "destructive" : "outline"} className="text-lg px-4 py-2">
              🍖 Голод: {hunger}%
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              💀 Убито: {victims.length}/{housePeople.length}
            </Badge>
            <Badge variant={killsToday >= 1 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
              🌙 День {dayNumber} | Убийств: {killsToday}/1
            </Badge>
          </div>

          {hunger >= 100 && (
            <Alert className="border-destructive bg-destructive/20 animate-pulse">
              <Icon name="Skull" className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-destructive font-bold">
                ПАРАЗИТ УМИРАЕТ ОТ ГОЛОДА! СРОЧНО НУЖНА ЖЕРТВА!
              </AlertDescription>
            </Alert>
          )}

          {hunger > 70 && hunger < 100 && (
            <Alert className="border-orange-500 bg-orange-500/20">
              <Icon name="AlertTriangle" className="h-5 w-5 text-orange-500" />
              <AlertDescription className="text-orange-500 font-bold">
                Паразит голоден... Ты чувствуешь слабость...
              </AlertDescription>
            </Alert>
          )}

          {parasiteMessages.length > 0 && (
            <Alert className="border-destructive bg-destructive/20 animate-pulse">
              <Icon name="Brain" className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-destructive font-bold">
                {parasiteMessages[parasiteMessages.length - 1]}
              </AlertDescription>
            </Alert>
          )}

          {randomCheck && suspicion > 30 && (
            <Alert className="border-primary/50 bg-primary/10">
              <Icon name="Eye" className="h-5 w-5" />
              <AlertDescription>
                <strong>Жители дома наблюдают за тобой.</strong> Они замечают странности...
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">🏠</div>
                <h2 className="text-3xl font-bold">Внутри дома</h2>
                <p className="text-muted-foreground">
                  {alivePeople.length} {alivePeople.length === 1 ? 'человек жив' : 'человека живы'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {housePeople.map(person => (
                  <Card 
                    key={person.id}
                    className={`p-6 ${!person.alive ? 'opacity-30 bg-destructive/10' : 'hover:border-primary cursor-pointer'}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-5xl">{person.avatar}</div>
                        {!person.alive && <div className="text-3xl">💀</div>}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{person.name}</h3>
                        {person.alive && (
                          <Badge variant={person.suspicion > 50 ? "destructive" : "secondary"} className="mt-2">
                            🔍 {person.suspicion}%
                          </Badge>
                        )}
                      </div>
                      {person.alive && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                setCurrentNPC(person);
                                setScreen('talk');
                              }}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              💬 Поговорить
                            </Button>
                            <Button 
                              onClick={() => {
                                if (inventory.some(i => i.includes('Таблетки'))) {
                                  const item = inventory.find(i => i.includes('Таблетки'))!;
                                  setInventory(prev => prev.filter(i => i !== item));
                                  setHousePeople(prev => prev.map(p => 
                                    p.id === person.id ? { ...p, suspicion: Math.max(0, p.suspicion - 30) } : p
                                  ));
                                  setDiscoveries(prev => [...prev, `Дал таблетки ${person.name}. Они стали доверчивее.`]);
                                } else {
                                  const giftSuspicionReduce = Math.floor(Math.random() * 15) + 10;
                                  setHousePeople(prev => prev.map(p => 
                                    p.id === person.id ? { ...p, suspicion: Math.max(0, p.suspicion - giftSuspicionReduce) } : p
                                  ));
                                  setDiscoveries(prev => [...prev, `Помог ${person.name}. Они стали доверчивее.`]);
                                }
                              }}
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                            >
                              🤝 Помочь
                            </Button>
                          </div>
                          <Button 
                            onClick={() => {
                              if (killsToday >= 1) {
                                return;
                              }
                              if (person.suspicion > 70) {
                                setEndingType('died');
                                setScreen('ending');
                                playSound('gunshot');
                              } else {
                                killPerson(person);
                              }
                            }}
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            disabled={killsToday >= 1}
                            title={killsToday >= 1 ? "Только 1 убийство в день" : ""}
                          >
                            {killsToday >= 1 ? '⏳ Использовано' : '🔪 Убить'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {madness >= 100 && (
                <Alert className="border-destructive bg-destructive/30">
                  <Icon name="Skull" className="h-5 w-5" />
                  <AlertDescription className="text-destructive font-bold">
                    ПАРАЗИТ ПОЛНОСТЬЮ КОНТРОЛИРУЕТ ТЕБЯ
                  </AlertDescription>
                </Alert>
              )}

              {inventory.length > 0 && (
                <Card className="p-4 bg-primary/5">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Icon name="Backpack" size={20} />
                    Инвентарь
                  </h3>
                  <div className="space-y-2">
                    {inventory.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <span className="text-sm">{item}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => useItem(item)}
                        >
                          Использовать
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {discoveries.length > 0 && (
                <Card className="p-4 bg-muted/50">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Icon name="ScrollText" size={20} />
                    Последние события
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {discoveries.slice(-3).map((d, idx) => (
                      <div key={idx}>• {d}</div>
                    ))}
                  </div>
                </Card>
              )}

              <Button
                onClick={() => {
                  setKillsToday(0);
                  setDayNumber(prev => prev + 1);
                  setSuspicion(prev => Math.max(0, prev - 10));
                  setMadness(prev => Math.min(100, prev + 10));
                  setHunger(prev => Math.min(100, prev + 25));
                  if (Math.random() > 0.5) triggerRandomEvent();
                  addParasiteMessage();
                  playSound('door');
                }}
                size="lg"
                variant="outline"
                className="w-full text-xl py-6"
              >
                🌙 Лечь спать (Следующий день)
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'talk' && currentNPC) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto space-y-6 pt-8">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => setScreen('inside')}
            >
              <Icon name="ArrowLeft" className="mr-2" size={16} />
              Назад
            </Button>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              🧠 {madness}%
            </Badge>
          </div>

          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="text-6xl">{currentNPC.avatar}</div>
                <h2 className="text-2xl font-bold">{currentNPC.name}</h2>
                <Badge variant={currentNPC.suspicion > 50 ? "destructive" : "secondary"}>
                  🔍 Подозрение: {currentNPC.suspicion}%
                </Badge>
              </div>

              <ScrollArea className="h-[400px] w-full border rounded-lg p-4">
                <div className="space-y-4">
                  {dialogueHistory.length === 0 && (
                    <p className="text-muted-foreground text-center italic">
                      Начни разговор...
                    </p>
                  )}
                  {dialogueHistory.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === 'player' 
                          ? 'bg-primary/20 ml-12' 
                          : msg.role === 'parasite'
                          ? 'bg-destructive/20 text-destructive font-bold'
                          : 'bg-secondary mr-12'
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">
                        {msg.role === 'player' ? 'Ты' : msg.role === 'parasite' ? 'Паразит' : currentNPC.name}
                      </p>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                  {isAITyping && (
                    <div className="bg-secondary mr-12 p-3 rounded-lg">
                      <p className="text-sm italic">Печатает...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="space-y-3">
                <Textarea
                  placeholder="Что скажешь?"
                  value={playerMessage}
                  onChange={(e) => setPlayerMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                  disabled={isAITyping}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!playerMessage.trim() || isAITyping}
                  size="lg"
                  className="w-full"
                >
                  Отправить
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }



  if (screen === 'ending') {
    if (endingType === 'killed-all') {
      return (
        <div className="min-h-screen p-4 bg-black flex items-center justify-center">
          <Card className="p-12 bg-destructive/20 border-4 border-destructive max-w-2xl">
            <div className="space-y-8 text-center">
              <div className="text-9xl animate-pulse">💀</div>
              <div className="space-y-6">
                <h2 className="text-5xl font-bold text-destructive">ВСЕ МЕРТВЫ</h2>
                <p className="text-2xl text-foreground">
                  Ты убил всех {housePeople.length} человек
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  {victims.map((v, idx) => (
                    <div key={idx} className="text-4xl opacity-50">{v.avatar}</div>
                  ))}
                </div>
                <p className="text-lg text-muted-foreground italic">
                  "Паразит доволен. Ты больше не человек."
                </p>
              </div>
              <Button 
                onClick={onExit}
                variant="outline"
                size="lg"
                className="w-full border-destructive text-destructive"
              >
                В меню
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    if (endingType === 'died') {
      return (
        <div className="min-h-screen p-4 bg-black flex items-center justify-center">
          <Card className="p-12 bg-card max-w-2xl">
            <div className="space-y-8 text-center">
              {deathStep < deathSteps.length - 1 ? (
                <>
                  <div className="text-7xl">{deathStep < 5 ? '💀' : deathStep < 12 ? '🌌' : '☕'}</div>
                  <p className="text-2xl text-foreground animate-fade-in">
                    {deathSteps[deathStep]}
                  </p>
                  <Button 
                    onClick={() => {
                      setDeathStep(prev => prev + 1);
                      playSound('click');
                    }}
                    variant="outline"
                    size="lg"
                  >
                    ...
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-7xl">🏠</div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-primary">ХОРОШАЯ КОНЦОВКА</h2>
                    <p className="text-xl text-foreground">
                      Ты в доме в космосе. Навсегда.
                    </p>
                    <p className="text-lg text-muted-foreground italic">
                      "Здесь тебе хорошо. Здесь ты в безопасности."
                    </p>
                  </div>
                  <Button 
                    onClick={onExit}
                    className="bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    В меню
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-background to-primary/20 flex items-center justify-center">
        <Card className="p-12 bg-card border-4 border-primary max-w-2xl">
          <div className="space-y-8 text-center">
            <div className="text-9xl">🎉</div>
            <div className="space-y-6">
              <h2 className="text-5xl font-bold text-primary">ТЫ СВОБОДЕН!</h2>
              <p className="text-2xl text-foreground">
                Ты смог избавиться от паразита
              </p>
              <p className="text-lg text-muted-foreground italic">
                "Боль. Кровь. Но ты вырвал паразита из своего уха."
              </p>
              <p className="text-md text-muted-foreground">
                Безумие: {madness}% → 0%
              </p>
            </div>
            <Button 
              onClick={onExit}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              В меню
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default MonsterMode;