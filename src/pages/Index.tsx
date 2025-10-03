import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

type GameState = 'menu' | 'arrival' | 'door-dialogue' | 'house' | 'inspection' | 'dialogue' | 'kcs' | 'journal';

interface Person {
  id: number;
  name: string;
  isInfected: boolean;
  avatar: string;
  suspiciousTraits: string[];
  wasChecked: boolean;
  dialogue: string[];
  currentDialogueIndex: number;
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
    "Пожалуйста, впустите! На улице жуткий холод!",
    "Я с соседней улицы, дом разрушен... Помогите!",
    "Я замерзаю... Прошу вас, откройте дверь!",
    "Там все мертвы... Я один выжил...",
  ],
  doorInfected: [
    "Откройте... пожалуйста...",
    "Холодно... так холодно... впустите...",
    "Я... я не помню... где я...",
    "Дверь... откройте дверь... сейчас...",
  ],
  normal: [
    "Спасибо, что впустили! Там на улице невыносимо холодно...",
    "Я шёл из соседнего района, видел много замёрзших людей.",
    "Как вы думаете, когда закончится этот кошмар?",
    "У вас есть что-нибудь поесть? Я не ел два дня.",
  ],
  infected: [
    "Да... холодно было... очень...",
    "Я... я не помню как сюда попал...",
    "В ушах странный звук... вы слышите?",
    "Почему вы на меня так смотрите?...",
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

  const playSound = (type: 'knock' | 'door' | 'footstep' | 'gunshot' | 'scream') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch(type) {
        case 'knock':
          oscillator.frequency.value = 200;
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
        case 'gunshot':
          oscillator.frequency.value = 100;
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case 'scream':
          oscillator.frequency.value = 400;
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        case 'door':
          oscillator.frequency.value = 150;
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'footstep':
          oscillator.frequency.value = 80;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.15);
          break;
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const generatePerson = (): Person => {
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
      id: Date.now(),
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
    setPeopleInHouse([]);
    setDay(1);
    setSurvivedDays(0);
    setJournalEntries(['День 1: Начался аномальный холод. Выходить на улицу опасно. Одному оставаться нельзя — гости найдут и убьют.']);
    setCurrentArrival(generatePerson());
    setGameState('arrival');
    setAloneWarning(false);
    playSound('knock');
  };

  const startDoorDialogue = () => {
    if (!currentArrival) return;
    setChatHistory([{
      sender: currentArrival.name,
      text: currentArrival.dialogue[0]
    }]);
    setCurrentArrival({...currentArrival, currentDialogueIndex: 0});
    setGameState('door-dialogue');
  };

  const sendDoorMessage = () => {
    if (!userMessage.trim() || !currentArrival) return;
    
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
    setJournalEntries(prev => [...prev, `День ${day}: Отказали ${currentArrival.name}. Они остались на морозе...`]);
    setCurrentArrival(null);
    setChatHistory([]);
    setGameState('house');
  };

  const startInspection = (person: Person) => {
    setSelectedPerson(person);
    setChatHistory([]);
    setDiscoveredTraits([]);
    setGameState('inspection');
  };

  const checkTrait = (traitName: string) => {
    if (!selectedPerson || discoveredTraits.includes(traitName)) return;
    
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
    
    setGameState('dialogue');
    setChatHistory([{
      sender: selectedPerson.name,
      text: selectedPerson.dialogue[0]
    }]);
  };

  const sendMessage = () => {
    if (!userMessage.trim() || !selectedPerson) return;
    
    setChatHistory(prev => [...prev, {
      sender: 'Вы',
      text: userMessage
    }]);

    setTimeout(() => {
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
    }, 1000);

    setUserMessage('');
  };

  const shootPerson = () => {
    if (!selectedPerson) return;
    
    playSound('gunshot');
    
    if (selectedPerson.isInfected) {
      playSound('scream');
      setPeopleInHouse(prev => prev.filter(p => p.id !== selectedPerson.id));
      setJournalEntries(prev => [...prev, `День ${day}: Застрелили ${selectedPerson.name}. Это был заражённый. Правильное решение.`]);
    } else {
      setPeopleInHouse(prev => prev.filter(p => p.id !== selectedPerson.id));
      setJournalEntries(prev => [...prev, `День ${day}: Застрелили невинного ${selectedPerson.name}... Ошибка.`]);
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

  const endDay = () => {
    const uncheckedInfected = peopleInHouse.find(p => p.isInfected && !p.wasChecked);
    
    if (uncheckedInfected) {
      playSound('scream');
      setJournalEntries(prev => [...prev, `Ночь дня ${day}: ${uncheckedInfected.name} потерял контроль. Паразит взял верх. Все мертвы.`]);
      setTimeout(() => {
        setGameState('menu');
      }, 2000);
      return;
    }

    if (peopleInHouse.length === 0) {
      setAloneWarning(true);
      playSound('scream');
      setJournalEntries(prev => [...prev, `Ночь дня ${day}: Вы остались один. Гости придут и убьют вас...`]);
      setTimeout(() => {
        setJournalEntries(prev => [...prev, `День ${day}: Игра окончена. Гости нашли вас одного.`]);
        setGameState('menu');
      }, 2000);
      return;
    }

    setDay(prev => prev + 1);
    setSurvivedDays(prev => prev + 1);
    setJournalEntries(prev => [...prev, `Ночь дня ${day}: День прошёл. Все живы. Вы не одиноки.`]);
    setCurrentArrival(generatePerson());
    setGameState('arrival');
    playSound('knock');
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
                onClick={() => setGameState('kcs')}
                variant="outline"
                className="w-full border-2"
                size="lg"
              >
                База знаний КЧС
              </Button>

              <Button 
                onClick={() => setGameState('journal')}
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
                                {person.wasChecked && (
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

                <Button 
                  onClick={endDay}
                  className="w-full bg-primary hover:bg-primary/90 border-2 border-primary"
                  size="lg"
                >
                  <Icon name="Moon" className="mr-2" size={20} />
                  Закончить день
                </Button>
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
    </div>
  );
};

export default Index;