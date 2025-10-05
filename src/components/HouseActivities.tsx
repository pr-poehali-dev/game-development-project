import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HouseActivitiesProps {
  onBack: () => void;
  addJournalEntry: (entry: string) => void;
  playSound: (type: string) => void;
  day: number;
}

const HouseActivities = ({ onBack, addJournalEntry, playSound, day }: HouseActivitiesProps) => {
  const [inventory, setInventory] = useState<string[]>([]);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [miniGameActive, setMiniGameActive] = useState<string | null>(null);
  const [lockpickAttempts, setLockpickAttempts] = useState(3);
  const [radioFrequency, setRadioFrequency] = useState(87.5);
  const [cardDrawn, setCardDrawn] = useState<string | null>(null);

  const searchLocations = [
    { id: 'basement', name: '🔦 Подвал', danger: 70, items: ['🗝️ Старый ключ', '📦 Ящик с консервами', '🔋 Батарейки'] },
    { id: 'attic', name: '🪜 Чердак', danger: 50, items: ['📻 Старое радио', '📸 Фотографии', '🎭 Маска'] },
    { id: 'kitchen', name: '🍳 Кухня', danger: 20, items: ['🔪 Нож', '🧂 Соль', '🍞 Хлеб'] },
    { id: 'bathroom', name: '🚿 Ванная', danger: 40, items: ['💊 Аптечка', '🪒 Бритва', '🪞 Зеркало'] },
    { id: 'closet', name: '🚪 Кладовка', danger: 60, items: ['⚒️ Инструменты', '🕯️ Свечи', '🧹 Метла'] },
  ];

  const radioStations = [
    { freq: 88.3, name: 'Экстренное вещание', message: '⚠️ Всем оставаться дома. Паразиты распространяются через замёрзших.' },
    { freq: 92.7, name: 'Музыка конца света', message: '🎵 *играет печальная мелодия* ...последние записи человечества...' },
    { freq: 101.1, name: 'Шифр КЧС', message: '📡 ...код 7-4-3...подтверждение...очаг заражения локализован...' },
    { freq: 105.5, name: 'Помехи', message: '📢 *шипение* ...кто-нибудь...слышит...помогите...*треск*' },
  ];

  const tarotCards = [
    { name: '☠️ Смерть', effect: 'bad', message: 'Смерть неизбежна. Сегодня кто-то умрёт.' },
    { name: '⭐ Звезда', effect: 'good', message: 'Надежда. Ты найдёшь то, что ищешь.' },
    { name: '🌙 Луна', effect: 'neutral', message: 'Обман. Не верь тому, что видишь.' },
    { name: '☀️ Солнце', effect: 'good', message: 'Свет в темноте. Завтра будет лучше.' },
    { name: '👹 Дьявол', effect: 'bad', message: 'Искушение. Паразит близко.' },
    { name: '🗡️ Меч', effect: 'neutral', message: 'Конфликт. Тебе придётся сделать выбор.' },
  ];

  const searchLocation = (locationId: string) => {
    playSound('click');
    const location = searchLocations.find(l => l.id === locationId);
    if (!location) return;

    const isDangerous = Math.random() * 100 < location.danger;
    
    if (isDangerous) {
      const dangers = [
        '💀 Ты нашёл труп! Он уже давно мёртв...',
        '🦠 Паразит выполз из вентиляции! Ты еле убежал!',
        '🕷️ Огромный паук! Ты в панике выбежал оттуда!',
        '👻 Странный шум... Кто-то здесь был недавно...',
      ];
      const danger = dangers[Math.floor(Math.random() * dangers.length)];
      setDiscovered(prev => [...prev, `${location.name}: ${danger}`]);
      addJournalEntry(`День ${day}: Обыскал ${location.name}. ${danger}`);
    } else {
      const foundItem = location.items[Math.floor(Math.random() * location.items.length)];
      setInventory(prev => [...prev, foundItem]);
      setDiscovered(prev => [...prev, `${location.name}: Найдено — ${foundItem}`]);
      addJournalEntry(`День ${day}: Обыскал ${location.name}. Найдено: ${foundItem}`);
      playSound('door');
    }
  };

  const tryLockpick = () => {
    if (lockpickAttempts <= 0) return;
    playSound('click');
    
    const success = Math.random() > 0.6;
    setLockpickAttempts(prev => prev - 1);

    if (success) {
      const treasures = ['💎 Алмаз', '🔑 Мастер-ключ', '📜 Карта', '🎁 Загадочная коробка'];
      const treasure = treasures[Math.floor(Math.random() * treasures.length)];
      setInventory(prev => [...prev, treasure]);
      setDiscovered(prev => [...prev, `🔓 Взлом успешен! Найдено: ${treasure}`]);
      addJournalEntry(`День ${day}: Взломал замок! Найдено: ${treasure}`);
      setMiniGameActive(null);
      playSound('door');
    } else {
      setDiscovered(prev => [...prev, `🔒 Неудача! Осталось попыток: ${lockpickAttempts - 1}`]);
      if (lockpickAttempts - 1 <= 0) {
        setDiscovered(prev => [...prev, '❌ Замок сломан. Попытки кончились.']);
        setMiniGameActive(null);
      }
    }
  };

  const tuneRadio = (freq: number) => {
    setRadioFrequency(freq);
    const station = radioStations.find(s => Math.abs(s.freq - freq) < 0.5);
    if (station) {
      playSound('ambient');
      setDiscovered(prev => [...prev, `📻 ${station.name}: ${station.message}`]);
      addJournalEntry(`День ${day}: Поймал радиостанцию: ${station.message}`);
    }
  };

  const drawCard = () => {
    playSound('click');
    const card = tarotCards[Math.floor(Math.random() * tarotCards.length)];
    setCardDrawn(card.name);
    setDiscovered(prev => [...prev, `🎴 Карта Таро: ${card.name} — ${card.message}`]);
    addJournalEntry(`День ${day}: Вытянул карту: ${card.name}. ${card.message}`);
  };

  if (miniGameActive === 'lockpick') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 bg-card border-4 border-primary">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">🔓 Взлом замка</h2>
              <div className="text-9xl">🔒</div>
              <p className="text-xl">Попыток осталось: {lockpickAttempts}/3</p>
              <p className="text-sm text-muted-foreground">Шанс успеха: 40%</p>
              
              <div className="space-y-3">
                <Button
                  onClick={tryLockpick}
                  disabled={lockpickAttempts <= 0}
                  size="lg"
                  className="w-full"
                >
                  Попытаться взломать
                </Button>
                <Button
                  onClick={() => setMiniGameActive(null)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Отказаться
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'radio') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 bg-card border-4 border-primary">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center">📻 Радио</h2>
              <div className="text-9xl text-center">📡</div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold">{radioFrequency.toFixed(1)} FM</p>
                </div>
                
                <input
                  type="range"
                  min="87"
                  max="108"
                  step="0.1"
                  value={radioFrequency}
                  onChange={(e) => tuneRadio(parseFloat(e.target.value))}
                  className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-2">
                  {radioStations.map((station) => (
                    <Button
                      key={station.freq}
                      onClick={() => tuneRadio(station.freq)}
                      variant="outline"
                      size="sm"
                    >
                      {station.freq} FM
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setMiniGameActive(null)}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Выключить радио
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'tarot') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 bg-card border-4 border-purple-500">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">🔮 Карты Таро</h2>
              <div className="text-9xl">{cardDrawn || '🎴'}</div>
              
              {cardDrawn && (
                <div className="bg-purple-900/50 p-6 rounded-lg">
                  <p className="text-2xl font-bold">{cardDrawn}</p>
                  <p className="text-lg mt-4">{tarotCards.find(c => c.name === cardDrawn)?.message}</p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={drawCard}
                  size="lg"
                  className="w-full"
                >
                  Вытянуть карту
                </Button>
                <Button
                  onClick={() => {
                    setMiniGameActive(null);
                    setCardDrawn(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6 pt-8">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onBack}>
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад
          </Button>
          <h2 className="text-3xl font-bold">🏠 Активности в доме</h2>
          <div className="w-24"></div>
        </div>

        {inventory.length > 0 && (
          <Card className="p-4 bg-primary/10">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Icon name="Package" size={20} />
              Инвентарь ({inventory.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {inventory.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {discovered.length > 0 && (
          <Card className="p-4 bg-muted/50">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Icon name="Scroll" size={20} />
              Недавние события
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {discovered.slice(-5).reverse().map((d, idx) => (
                <p key={idx} className="text-sm">• {d}</p>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-2xl font-bold mb-6">🔍 Обыскать комнаты</h3>
          <div className="grid grid-cols-2 gap-4">
            {searchLocations.map((location) => (
              <Button
                key={location.id}
                onClick={() => searchLocation(location.id)}
                variant="outline"
                className="h-20 text-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <span>{location.name}</span>
                  <Badge variant={location.danger > 60 ? "destructive" : location.danger > 40 ? "secondary" : "default"} className="text-xs">
                    Опасность: {location.danger}%
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-2xl font-bold mb-6">🎮 Мини-игры</h3>
          <div className="grid grid-cols-3 gap-4">
            <Button
              onClick={() => {
                setMiniGameActive('lockpick');
                setLockpickAttempts(3);
              }}
              size="lg"
              variant="outline"
              className="h-32 flex flex-col gap-3"
            >
              <div className="text-5xl">🔓</div>
              <span>Взлом замка</span>
            </Button>
            
            <Button
              onClick={() => setMiniGameActive('radio')}
              size="lg"
              variant="outline"
              className="h-32 flex flex-col gap-3"
            >
              <div className="text-5xl">📻</div>
              <span>Радио</span>
            </Button>

            <Button
              onClick={() => setMiniGameActive('tarot')}
              size="lg"
              variant="outline"
              className="h-32 flex flex-col gap-3"
            >
              <div className="text-5xl">🔮</div>
              <span>Карты Таро</span>
            </Button>
          </div>
        </Card>

        <Alert>
          <Icon name="Info" className="h-4 w-4" />
          <AlertDescription>
            Обыскивай дом, ищи предметы и играй в мини-игры чтобы скоротать время!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default HouseActivities;
