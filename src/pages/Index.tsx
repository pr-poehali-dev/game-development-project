import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

type GameState = 'menu' | 'gameplay' | 'kcs' | 'journal';
type TimeOfDay = 'day' | 'night';

interface Visitor {
  id: number;
  name: string;
  suspiciousTraits: string[];
  isGuest: boolean;
  avatar: string;
}

const guestTraits = [
  { id: 1, name: 'Необычные движения', icon: 'Move', description: 'Резкие, угловатые движения, неестественные позы' },
  { id: 2, name: 'Странное дыхание', icon: 'Wind', description: 'Прерывистое или отсутствующее дыхание' },
  { id: 3, name: 'Блеск глаз', icon: 'Eye', description: 'Стеклянный или неестественный взгляд' },
  { id: 4, name: 'Температура тела', icon: 'Thermometer', description: 'Необычно холодная или тёплая кожа' },
  { id: 5, name: 'Отсутствие эмоций', icon: 'UserX', description: 'Безэмоциональное поведение' },
  { id: 6, name: 'Нечёткое отражение', icon: 'Mirror', description: 'Размытое или искажённое отражение' },
  { id: 7, name: 'Необычные звуки', icon: 'Volume2', description: 'Шёпот, хрипы, неестественные звуки' },
  { id: 8, name: 'Неадекватные ответы', icon: 'MessageSquare', description: 'Односложные или невпопад ответы' },
  { id: 9, name: 'Отсутствие тени', icon: 'Sun', description: 'Искажённая или отсутствующая тень' },
  { id: 10, name: 'Изменение запаха', icon: 'Scan', description: 'Необычный или неприятный запах' },
];

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [day, setDay] = useState(1);
  const [survivedDays, setSurvivedDays] = useState(0);
  const [currentVisitor, setCurrentVisitor] = useState<Visitor | null>(null);
  const [journalEntries, setJournalEntries] = useState<string[]>([
    'День 1: Сосед предупредил об аномальном холоде. Начинается...',
  ]);

  const generateVisitor = (): Visitor => {
    const isGuest = Math.random() > 0.5;
    const names = ['Алексей', 'Мария', 'Иван', 'Елена', 'Дмитрий', 'Анна'];
    const suspiciousCount = isGuest ? Math.floor(Math.random() * 3) + 1 : 0;
    const selectedTraits = [...guestTraits]
      .sort(() => Math.random() - 0.5)
      .slice(0, suspiciousCount)
      .map(t => t.name);

    return {
      id: Date.now(),
      name: names[Math.floor(Math.random() * names.length)],
      suspiciousTraits: selectedTraits,
      isGuest,
      avatar: '👤',
    };
  };

  const startGame = () => {
    setGameState('gameplay');
    setDay(1);
    setSurvivedDays(0);
    setTimeOfDay('day');
    setCurrentVisitor(generateVisitor());
    setJournalEntries(['День 1: Сосед предупредил об аномальном холоде. Начинается...']);
  };

  const handleDecision = (decision: 'allow' | 'deny') => {
    if (!currentVisitor) return;

    const correct = (decision === 'deny' && currentVisitor.isGuest) || 
                    (decision === 'allow' && !currentVisitor.isGuest);

    if (!correct && currentVisitor.isGuest) {
      setJournalEntries(prev => [...prev, `День ${day}: Вы впустили гостя. Игра окончена.`]);
      setGameState('menu');
      return;
    }

    const entry = decision === 'allow' 
      ? `День ${day}: Впустили ${currentVisitor.name}. ${correct ? 'Правильное решение.' : 'Отказали невинному.'}`
      : `День ${day}: Отказали ${currentVisitor.name}. ${correct ? 'Правильное решение.' : 'Упущенный союзник.'}`;
    
    setJournalEntries(prev => [...prev, entry]);

    if (timeOfDay === 'day') {
      setTimeOfDay('night');
    } else {
      setDay(prev => prev + 1);
      setSurvivedDays(prev => prev + 1);
      setTimeOfDay('day');
      setCurrentVisitor(generateVisitor());
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {gameState === 'menu' && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-card">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-primary animate-flicker">ГОСТИ</h1>
              <p className="text-xl text-muted-foreground">Хоррор на выживание</p>
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

      {gameState === 'gameplay' && (
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
              
              <div className="flex gap-4 items-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  <Icon name="Calendar" className="mr-2" size={16} />
                  День {day}
                </Badge>
                <Badge 
                  variant={timeOfDay === 'day' ? 'default' : 'secondary'}
                  className="text-lg px-4 py-2"
                >
                  <Icon name={timeOfDay === 'day' ? 'Sun' : 'Moon'} className="mr-2" size={16} />
                  {timeOfDay === 'day' ? 'День' : 'Ночь'}
                </Badge>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setGameState('kcs')}
                className="border-2"
              >
                <Icon name="BookOpen" className="mr-2" size={16} />
                КЧС
              </Button>
            </div>

            {currentVisitor && (
              <Card className="p-8 bg-card border-2 animate-fade-in">
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{currentVisitor.avatar}</div>
                    <h2 className="text-3xl font-bold">{currentVisitor.name}</h2>
                    <p className="text-muted-foreground">
                      {timeOfDay === 'day' 
                        ? 'Стучится в дверь. Пустить внутрь?' 
                        : 'Наблюдайте за поведением...'}
                    </p>
                  </div>

                  {currentVisitor.suspiciousTraits.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground font-semibold">
                        <Icon name="AlertTriangle" className="inline mr-2 animate-pulse-danger" size={16} />
                        Подозрительные признаки:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentVisitor.suspiciousTraits.map((trait, idx) => (
                          <Badge key={idx} variant="destructive" className="text-sm">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {timeOfDay === 'day' && (
                    <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={() => handleDecision('allow')}
                        className="flex-1 bg-primary hover:bg-primary/90 border-2 border-primary"
                        size="lg"
                      >
                        <Icon name="DoorOpen" className="mr-2" size={20} />
                        Впустить
                      </Button>
                      <Button 
                        onClick={() => handleDecision('deny')}
                        variant="outline"
                        className="flex-1 border-2"
                        size="lg"
                      >
                        <Icon name="DoorClosed" className="mr-2" size={20} />
                        Отказать
                      </Button>
                    </div>
                  )}

                  {timeOfDay === 'night' && (
                    <Button 
                      onClick={() => {
                        setTimeOfDay('day');
                        setDay(prev => prev + 1);
                        setSurvivedDays(prev => prev + 1);
                        setCurrentVisitor(generateVisitor());
                      }}
                      className="w-full bg-primary hover:bg-primary/90 border-2 border-primary"
                      size="lg"
                    >
                      <Icon name="Moon" className="mr-2" size={20} />
                      Следующий день
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {gameState === 'kcs' && (
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setGameState(survivedDays > 0 ? 'gameplay' : 'menu')}
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
                  <p className="text-muted-foreground">
                    Организация по изучению и борьбе с гостями. Используйте эту информацию для распознавания нелюдей.
                  </p>
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
