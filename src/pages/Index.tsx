import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';

type GameState = 'menu' | 'arrival' | 'house' | 'kcs' | 'journal';

interface Person {
  id: number;
  name: string;
  isInfected: boolean;
  avatar: string;
  suspiciousTraits: string[];
  wasChecked: boolean;
}

const guestTraits = [
  { id: 1, name: 'Необычные движения', icon: 'Move', description: 'Резкие, угловатые движения после заражения паразитом' },
  { id: 2, name: 'Странное дыхание', icon: 'Wind', description: 'Паразит влияет на дыхательные функции' },
  { id: 3, name: 'Блеск глаз', icon: 'Eye', description: 'Стеклянный взгляд — признак контроля паразита' },
  { id: 4, name: 'Температура тела', icon: 'Thermometer', description: 'Холодная кожа из-за обморожения' },
  { id: 5, name: 'Отсутствие эмоций', icon: 'UserX', description: 'Паразит подавляет эмоциональные реакции' },
  { id: 6, name: 'Нечёткое отражение', icon: 'Mirror', description: 'Аномалия, связанная с паразитом' },
  { id: 7, name: 'Необычные звуки', icon: 'Volume2', description: 'Шёпот и хрипы при деградации мозга' },
  { id: 8, name: 'Неадекватные ответы', icon: 'MessageSquare', description: 'Потеря когнитивных функций' },
  { id: 9, name: 'Отсутствие тени', icon: 'Sun', description: 'Неизученная аномалия паразита' },
  { id: 10, name: 'Изменение запаха', icon: 'Scan', description: 'Разложение тканей под контролем паразита' },
];

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [day, setDay] = useState(1);
  const [survivedDays, setSurvivedDays] = useState(0);
  const [peopleInHouse, setPeopleInHouse] = useState<Person[]>([]);
  const [currentArrival, setCurrentArrival] = useState<Person | null>(null);
  const [journalEntries, setJournalEntries] = useState<string[]>([
    'День 1: Начался аномальный холод. Выходить на улицу опасно. Одному оставаться нельзя — гости найдут и убьют.',
  ]);
  const [aloneWarning, setAloneWarning] = useState(false);

  const generatePerson = (): Person => {
    const isInfected = Math.random() > 0.6;
    const names = ['Алексей', 'Мария', 'Иван', 'Елена', 'Дмитрий', 'Анна', 'Сергей', 'Ольга'];
    const suspiciousCount = isInfected ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2);
    const selectedTraits = [...guestTraits]
      .sort(() => Math.random() - 0.5)
      .slice(0, suspiciousCount)
      .map(t => t.name);

    return {
      id: Date.now(),
      name: names[Math.floor(Math.random() * names.length)],
      isInfected,
      avatar: '👤',
      suspiciousTraits: selectedTraits,
      wasChecked: false,
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
  };

  const letPersonIn = () => {
    if (!currentArrival) return;
    
    setPeopleInHouse(prev => [...prev, currentArrival]);
    setJournalEntries(prev => [...prev, `День ${day}: Впустили ${currentArrival.name} в дом.`]);
    setCurrentArrival(null);
    setGameState('house');
    setAloneWarning(false);
  };

  const denyPerson = () => {
    if (!currentArrival) return;
    
    setJournalEntries(prev => [...prev, `День ${day}: Отказали ${currentArrival.name}. Они остались на морозе...`]);
    setCurrentArrival(null);
    setGameState('house');
  };

  const checkPerson = (personId: number) => {
    const person = peopleInHouse.find(p => p.id === personId);
    if (!person || person.wasChecked) return;

    setPeopleInHouse(prev => 
      prev.map(p => p.id === personId ? { ...p, wasChecked: true } : p)
    );

    if (person.isInfected) {
      setJournalEntries(prev => [...prev, `День ${day}: ${person.name} был заражён! Начинается приступ безумия...`]);
      setTimeout(() => {
        setJournalEntries(prev => [...prev, `День ${day}: Игра окончена. Заражённый убил всех.`]);
        setGameState('menu');
      }, 2000);
    } else {
      setJournalEntries(prev => [...prev, `День ${day}: Проверка ${person.name} — чистый человек.`]);
    }
  };

  const removePerson = (personId: number) => {
    const person = peopleInHouse.find(p => p.id === personId);
    if (!person || !person.wasChecked) return;

    if (person.isInfected) {
      setPeopleInHouse(prev => prev.filter(p => p.id !== personId));
      setJournalEntries(prev => [...prev, `День ${day}: Изолировали ${person.name}. Дом в безопасности.`]);
    } else {
      setJournalEntries(prev => [...prev, `День ${day}: Вы изолировали невинного человека. Он погиб от холода...`]);
      setPeopleInHouse(prev => prev.filter(p => p.id !== personId));
    }
  };

  const endDay = () => {
    const uncheckedInfected = peopleInHouse.find(p => p.isInfected && !p.wasChecked);
    
    if (uncheckedInfected) {
      setJournalEntries(prev => [...prev, `Ночь дня ${day}: ${uncheckedInfected.name} потерял контроль. Паразит взял верх. Все мертвы.`]);
      setTimeout(() => {
        setGameState('menu');
      }, 2000);
      return;
    }

    if (peopleInHouse.length === 0) {
      setAloneWarning(true);
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
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {gameState === 'menu' && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-card">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-primary animate-flicker">ГОСТИ</h1>
              <p className="text-xl text-muted-foreground">Хоррор на выживание</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
                Паразиты-инопланетяне проникают через уши замёрзших людей. 
                Впускайте выживших, проверяйте их, но не оставайтесь одни...
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
                  <p className="text-muted-foreground">
                    "Пустите! На улице смертельный холод! Прошу вас!"
                  </p>
                </div>

                <div className="bg-secondary/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    <Icon name="Info" className="inline mr-2" size={16} />
                    Помните: проверить можно только ПОСЛЕ того, как впустите
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={letPersonIn}
                    className="flex-1 bg-primary hover:bg-primary/90 border-2 border-primary"
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
                                  <Badge 
                                    variant={person.isInfected ? 'destructive' : 'default'}
                                    className="text-xs"
                                  >
                                    {person.isInfected ? 'ЗАРАЖЁН!' : 'Чист'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {person.wasChecked && person.suspiciousTraits.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Признаки:</p>
                              <div className="flex flex-wrap gap-1">
                                {person.suspiciousTraits.map((trait, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {trait}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {!person.wasChecked && (
                              <Button 
                                onClick={() => checkPerson(person.id)}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <Icon name="Search" className="mr-1" size={14} />
                                Проверить
                              </Button>
                            )}
                            {person.wasChecked && (
                              <Button 
                                onClick={() => removePerson(person.id)}
                                size="sm"
                                variant={person.isInfected ? 'destructive' : 'outline'}
                                className="flex-1"
                              >
                                <Icon name="UserX" className="mr-1" size={14} />
                                Изолировать
                              </Button>
                            )}
                          </div>
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
