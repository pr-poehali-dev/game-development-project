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
  const [bookPage, setBookPage] = useState(0);
  const [selectedBook, setSelectedBook] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState<number | null>(null);
  const [chessMove, setChessMove] = useState(0);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [photoPage, setPhotoPage] = useState(0);
  const [diaryText, setDiaryText] = useState('');
  const [cookingInProgress, setCookingInProgress] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);

  const searchLocations = [
    { id: 'basement', name: '🔦 Подвал', danger: 70, items: ['🗝️ Старый ключ', '📦 Консервы', '🔋 Батарейки', '🎒 Рюкзак'] },
    { id: 'attic', name: '🪜 Чердак', danger: 50, items: ['📻 Радио', '📸 Фотографии', '🎭 Маска', '🕯️ Свечи'] },
    { id: 'kitchen', name: '🍳 Кухня', danger: 20, items: ['🔪 Нож', '🧂 Соль', '🍞 Хлеб', '☕ Кофе'] },
    { id: 'bathroom', name: '🚿 Ванная', danger: 40, items: ['💊 Аптечка', '🪒 Бритва', '🪞 Зеркало', '🧴 Мыло'] },
    { id: 'closet', name: '🚪 Кладовка', danger: 60, items: ['⚒️ Инструменты', '🧹 Метла', '📦 Коробки', '🔦 Фонарь'] },
    { id: 'bedroom', name: '🛏️ Спальня', danger: 30, items: ['📕 Книга', '💤 Подушка', '🧸 Игрушка', '👔 Одежда'] },
  ];

  const radioStations = [
    { freq: 88.3, name: 'Экстренка', msg: '⚠️ СРОЧНО: Паразиты активны ночью. Не выходите!' },
    { freq: 92.7, name: 'Музыка', msg: '🎵 *печальная мелодия конца света*' },
    { freq: 101.1, name: 'Шифр КЧС', msg: '📡 ...код 7-4-3...очаг заражения...*помехи*' },
    { freq: 105.5, name: 'Помехи', msg: '📢 *шшш*...кто-нибудь...помогите...*треск*' },
    { freq: 95.0, name: 'Незнакомец', msg: '👤 *шёпот* ...я знаю твой секрет...' },
    { freq: 107.9, name: 'Тишина', msg: '...' },
  ];

  const tarotCards = [
    { name: '☠️ Смерть', msg: 'Смерть близко. Сегодня кто-то умрёт.' },
    { name: '⭐ Звезда', msg: 'Надежда! Ты найдёшь то, что ищешь.' },
    { name: '🌙 Луна', msg: 'Обман. Не верь глазам.' },
    { name: '☀️ Солнце', msg: 'Завтра будет лучше!' },
    { name: '👹 Дьявол', msg: 'Паразит рядом...' },
    { name: '🗡️ Меч', msg: 'Тебе придётся убить.' },
    { name: '🏠 Башня', msg: 'Твой дом падёт.' },
    { name: '❤️ Любовь', msg: 'Кто-то любит тебя.' },
  ];

  const books = [
    { 
      title: '📕 Выживание в холоде', 
      pages: [
        'Глава 1: При -30°C человек замерзает за 10 минут.',
        'Глава 2: Первый признак обморожения — потеря чувствительности.',
        'Глава 3: Никогда не засыпай на морозе. Это смерть.',
        'Глава 4: Если видишь замёрзшего — не трогай. Паразиты внутри.',
        'Глава 5: Держи запас еды и топлива. Помощь не придёт.'
      ]
    },
    {
      title: '📗 Дневник учёного',
      pages: [
        'День 1: Обнаружили новый паразит. Проникает через ухо.',
        'День 3: Паразит берёт контроль за 48 часов.',
        'День 5: Заражённые убивают всех...',
        'День 7: Я заражён. Чувствую его внутри.',
        'День 9: ...убей их всех... НЕТ! Я НЕ...*нераз борчиво*'
      ]
    },
    {
      title: '📘 История города',
      pages: [
        'Этот город построен 200 лет назад на древнем кладбище.',
        'Легенды говорят о проклятии шамана.',
        'Каждые 50 лет — массовая гибель людей.',
        'Последняя катастрофа была 47 лет назад. Сейчас — 50-й год.'
      ]
    },
  ];

  const recipes = [
    { name: '🍲 Суп из консервов', time: 3, result: '+15% морали' },
    { name: '🍞 Тосты', time: 1, result: '+5% морали' },
    { name: '☕ Кофе', time: 2, result: '+10% энергии' },
    { name: '🍝 Макароны', time: 4, result: '+20% морали' },
  ];

  const songs = [
    { name: '🎵 Последняя песня', mood: 'Грустная' },
    { name: '🎸 Рок конца света', mood: 'Энергичная' },
    { name: '🎹 Тишина после бури', mood: 'Спокойная' },
    { name: '🥁 Пульс мёртвого города', mood: 'Тревожная' },
  ];

  const photos = [
    '📸 Семейное фото. Все улыбаются. Это было давно...',
    '📸 День рождения. Торт, свечи. Никто не знал что будет.',
    '📸 Поход в горы. Солнце, природа. Тогда было тепло.',
    '📸 Последнее фото. За окном уже снег. Начало конца.',
    '📸 Пустая фотография. На обороте: "Извини..."'
  ];

  const exercises = [
    { name: '💪 Отжимания', sets: 3 },
    { name: '🏃 Бег на месте', sets: 5 },
    { name: '🧘 Йога', sets: 2 },
  ];

  const searchLocation = (locId: string) => {
    playSound('click');
    const loc = searchLocations.find(l => l.id === locId);
    if (!loc) return;

    if (Math.random() * 100 < loc.danger) {
      const dangers = ['💀 Труп!', '🦠 Паразит!', '🕷️ Паук!', '👻 Шум...'];
      const d = dangers[Math.floor(Math.random() * dangers.length)];
      setDiscovered(prev => [...prev, `${loc.name}: ${d}`]);
      addJournalEntry(`День ${day}: ${loc.name} — ${d}`);
    } else {
      const item = loc.items[Math.floor(Math.random() * loc.items.length)];
      setInventory(prev => [...prev, item]);
      setDiscovered(prev => [...prev, `${loc.name}: ${item}`]);
      addJournalEntry(`День ${day}: ${loc.name} → ${item}`);
      playSound('door');
    }
  };

  const tryLockpick = () => {
    if (lockpickAttempts <= 0) return;
    playSound('click');
    const success = Math.random() > 0.6;
    setLockpickAttempts(prev => prev - 1);

    if (success) {
      const items = ['💎 Алмаз', '🔑 Мастер-ключ', '📜 Карта', '🎁 Коробка'];
      const item = items[Math.floor(Math.random() * items.length)];
      setInventory(prev => [...prev, item]);
      setDiscovered(prev => [...prev, `🔓 Взлом! ${item}`]);
      addJournalEntry(`День ${day}: Взломал замок → ${item}`);
      setMiniGameActive(null);
    } else {
      setDiscovered(prev => [...prev, `🔒 Неудача! ${lockpickAttempts - 1}/3`]);
    }
  };

  const tuneRadio = (freq: number) => {
    setRadioFrequency(freq);
    const station = radioStations.find(s => Math.abs(s.freq - freq) < 0.5);
    if (station) {
      playSound('ambient');
      setDiscovered(prev => [...prev, `📻 ${station.name}: ${station.msg}`]);
    }
  };

  const drawCard = () => {
    playSound('click');
    const card = tarotCards[Math.floor(Math.random() * tarotCards.length)];
    setCardDrawn(card.name);
    setDiscovered(prev => [...prev, `🎴 ${card.name}: ${card.msg}`]);
    addJournalEntry(`День ${day}: Карта ${card.name}`);
  };

  const startCooking = (idx: number) => {
    const recipe = recipes[idx];
    setSelectedRecipe(idx);
    setCookingInProgress(recipe.time);
    playSound('click');
    
    const interval = setInterval(() => {
      setCookingInProgress(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setDiscovered(prev => [...prev, `${recipe.name}: Готово! ${recipe.result}`]);
          addJournalEntry(`День ${day}: Приготовил ${recipe.name}`);
          setCookingInProgress(null);
          setSelectedRecipe(null);
          playSound('door');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (miniGameActive === 'lockpick') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 border-4">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">🔓 Взлом замка</h2>
              <div className="text-9xl">🔒</div>
              <p className="text-xl">Попыток: {lockpickAttempts}/3</p>
              <Button onClick={tryLockpick} disabled={lockpickAttempts <= 0} size="lg" className="w-full">
                Попытаться
              </Button>
              <Button onClick={() => setMiniGameActive(null)} variant="outline" size="lg" className="w-full">
                Назад
              </Button>
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
          <Card className="p-8 border-4">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center">📻 Радио</h2>
              <div className="text-9xl text-center">📡</div>
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
                className="w-full h-4 bg-gray-700 rounded-lg"
              />
              <div className="grid grid-cols-3 gap-2">
                {radioStations.map((s) => (
                  <Button key={s.freq} onClick={() => tuneRadio(s.freq)} variant="outline" size="sm">
                    {s.freq}
                  </Button>
                ))}
              </div>
              <Button onClick={() => setMiniGameActive(null)} variant="outline" size="lg" className="w-full">
                Выключить
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
          <Card className="p-8 border-4 border-purple-500">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">🔮 Карты Таро</h2>
              <div className="text-9xl">{cardDrawn || '🎴'}</div>
              {cardDrawn && (
                <div className="bg-purple-900/50 p-6 rounded-lg">
                  <p className="text-2xl">{cardDrawn}</p>
                </div>
              )}
              <Button onClick={drawCard} size="lg" className="w-full">Вытянуть карту</Button>
              <Button onClick={() => { setMiniGameActive(null); setCardDrawn(null); }} variant="outline" size="lg" className="w-full">
                Закрыть
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'cooking') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 border-4 border-orange-500">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center">👨‍🍳 Готовка</h2>
              <div className="text-9xl text-center">🍳</div>
              {cookingInProgress !== null && (
                <div className="bg-orange-900/50 p-6 rounded-lg text-center animate-pulse">
                  <p className="text-2xl">🔥 Готовим... {cookingInProgress} сек</p>
                </div>
              )}
              <div className="space-y-3">
                {recipes.map((r, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{r.name}</h3>
                        <p className="text-sm text-muted-foreground">{r.time} сек</p>
                      </div>
                      <Button onClick={() => startCooking(idx)} disabled={cookingInProgress !== null} size="sm">
                        Готовить
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <Button onClick={() => setMiniGameActive(null)} variant="outline" size="lg" className="w-full">
                Назад
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'reading') {
    const book = books[selectedBook];
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 border-4 border-amber-700">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center">{book.title}</h2>
              <div className="text-9xl text-center">📖</div>
              <div className="bg-amber-900/30 p-6 rounded-lg min-h-[200px]">
                <p className="text-lg">{book.pages[bookPage]}</p>
              </div>
              <div className="flex items-center justify-between">
                <Button onClick={() => setBookPage(p => Math.max(0, p - 1))} disabled={bookPage === 0} variant="outline">
                  ← Назад
                </Button>
                <Badge>{bookPage + 1}/{book.pages.length}</Badge>
                <Button onClick={() => setBookPage(p => Math.min(book.pages.length - 1, p + 1))} disabled={bookPage >= book.pages.length - 1} variant="outline">
                  Вперёд →
                </Button>
              </div>
              <Button onClick={() => { setMiniGameActive(null); setBookPage(0); }} variant="outline" size="lg" className="w-full">
                Закрыть
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'music') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 border-4 border-purple-500">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">🎧 Музыка</h2>
              <div className="text-9xl animate-pulse">{musicPlaying !== null ? '🔊' : '🔇'}</div>
              <div className="space-y-3">
                {songs.map((s, idx) => (
                  <Button key={idx} onClick={() => { setMusicPlaying(idx); playSound('ambient'); }} variant="outline" size="lg" className="w-full">
                    <div className="flex items-center justify-between w-full">
                      <span>{s.name}</span>
                      <Badge>{s.mood}</Badge>
                    </div>
                  </Button>
                ))}
              </div>
              <Button onClick={() => { setMiniGameActive(null); setMusicPlaying(null); }} variant="outline" size="lg" className="w-full">
                Выключить
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'chess') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 border-4">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">♟️ Шахматы с ИИ</h2>
              <div className="text-9xl">♜</div>
              <p className="text-2xl">Ход #{chessMove}</p>
              <Button onClick={() => {
                setChessMove(p => p + 1);
                playSound('click');
                if (Math.random() > 0.7) {
                  setDiscovered(prev => [...prev, `♟️ Победа на ${chessMove + 1} ходу!`]);
                  setMiniGameActive(null);
                  setChessMove(0);
                }
              }} size="lg" className="w-full">
                Сделать ход
              </Button>
              <Button onClick={() => { setMiniGameActive(null); setChessMove(0); }} variant="destructive" size="lg" className="w-full">
                Сдаться
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'exercise') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 border-4 border-green-500">
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold">💪 Тренировка</h2>
              <div className="text-9xl">🏋️</div>
              <div className="space-y-4">
                {exercises.map((ex, idx) => (
                  <Card key={idx} className="p-4">
                    <h3 className="text-2xl font-bold">{ex.name}</h3>
                    <p className="text-muted-foreground">Подходы: {ex.sets}</p>
                    <Button onClick={() => {
                      setExerciseCount(p => p + 1);
                      playSound('click');
                      if (exerciseCount + 1 >= ex.sets) {
                        setDiscovered(prev => [...prev, `${ex.name}: Выполнено!`]);
                        setExerciseCount(0);
                      }
                    }} size="lg" className="w-full mt-3">
                      Выполнить ({exerciseCount}/{ex.sets})
                    </Button>
                  </Card>
                ))}
              </div>
              <Button onClick={() => { setMiniGameActive(null); setExerciseCount(0); }} variant="outline" size="lg" className="w-full">
                Закончить
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'photos') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 border-4 border-blue-500">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center">📷 Фотоальбом</h2>
              <div className="text-9xl text-center">🖼️</div>
              <div className="bg-blue-900/30 p-8 rounded-lg min-h-[200px] flex items-center justify-center">
                <p className="text-xl italic text-center">{photos[photoPage]}</p>
              </div>
              <div className="flex items-center justify-between">
                <Button onClick={() => setPhotoPage(p => Math.max(0, p - 1))} disabled={photoPage === 0} variant="outline">
                  ←
                </Button>
                <Badge>{photoPage + 1}/{photos.length}</Badge>
                <Button onClick={() => setPhotoPage(p => Math.min(photos.length - 1, p + 1))} disabled={photoPage >= photos.length - 1} variant="outline">
                  →
                </Button>
              </div>
              <Button onClick={() => { setMiniGameActive(null); setPhotoPage(0); }} variant="outline" size="lg" className="w-full">
                Закрыть
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (miniGameActive === 'diary') {
    return (
      <div className="min-h-screen p-4 bg-black/90">
        <div className="max-w-4xl mx-auto space-y-6 pt-20">
          <Card className="p-8 border-4 border-yellow-700">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center">📔 Дневник</h2>
              <div className="text-9xl text-center">✍️</div>
              <textarea
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                placeholder="Напиши свои мысли..."
                className="w-full h-64 p-4 bg-yellow-50/10 rounded-lg border-2 resize-none text-foreground"
              />
              <Button onClick={() => {
                if (diaryText.trim()) {
                  addJournalEntry(`День ${day}: Дневник: "${diaryText}"`);
                  setDiscovered(prev => [...prev, `Записал: "${diaryText.slice(0, 30)}..."`]);
                  setDiaryText('');
                  playSound('click');
                }
              }} disabled={!diaryText.trim()} size="lg" className="w-full">
                Сохранить
              </Button>
              <Button onClick={() => { setMiniGameActive(null); setDiaryText(''); }} variant="outline" size="lg" className="w-full">
                Закрыть
              </Button>
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
          <h2 className="text-3xl font-bold">🏠 Активности</h2>
          <div className="w-24"></div>
        </div>

        {inventory.length > 0 && (
          <Card className="p-4 bg-primary/10">
            <h3 className="font-bold mb-3">🎒 Инвентарь ({inventory.length})</h3>
            <div className="flex flex-wrap gap-2">
              {inventory.map((item, idx) => (
                <Badge key={idx} variant="secondary">{item}</Badge>
              ))}
            </div>
          </Card>
        )}

        {discovered.length > 0 && (
          <Card className="p-4 bg-muted/50">
            <h3 className="font-bold mb-3">📜 События</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {discovered.slice(-5).reverse().map((d, idx) => (
                <p key={idx} className="text-sm">• {d}</p>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-2xl font-bold mb-6">🔍 Обыскать</h3>
          <div className="grid grid-cols-3 gap-4">
            {searchLocations.map((loc) => (
              <Button key={loc.id} onClick={() => searchLocation(loc.id)} variant="outline" className="h-20 flex flex-col gap-2">
                <span>{loc.name}</span>
                <Badge variant={loc.danger > 60 ? "destructive" : "default"} className="text-xs">
                  {loc.danger}%
                </Badge>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-2xl font-bold mb-6">🎮 Развлечения</h3>
          <div className="grid grid-cols-5 gap-4">
            <Button onClick={() => { setMiniGameActive('lockpick'); setLockpickAttempts(3); }} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">🔓</div>
              <span className="text-xs">Взлом</span>
            </Button>
            <Button onClick={() => setMiniGameActive('radio')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">📻</div>
              <span className="text-xs">Радио</span>
            </Button>
            <Button onClick={() => setMiniGameActive('tarot')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">🔮</div>
              <span className="text-xs">Таро</span>
            </Button>
            <Button onClick={() => setMiniGameActive('cooking')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">👨‍🍳</div>
              <span className="text-xs">Готовка</span>
            </Button>
            <Button onClick={() => setMiniGameActive('reading')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">📖</div>
              <span className="text-xs">Книги</span>
            </Button>
            <Button onClick={() => setMiniGameActive('music')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">🎧</div>
              <span className="text-xs">Музыка</span>
            </Button>
            <Button onClick={() => setMiniGameActive('chess')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">♟️</div>
              <span className="text-xs">Шахматы</span>
            </Button>
            <Button onClick={() => setMiniGameActive('exercise')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">💪</div>
              <span className="text-xs">Спорт</span>
            </Button>
            <Button onClick={() => setMiniGameActive('photos')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">📷</div>
              <span className="text-xs">Фото</span>
            </Button>
            <Button onClick={() => setMiniGameActive('diary')} variant="outline" className="h-28 flex flex-col gap-2">
              <div className="text-4xl">📔</div>
              <span className="text-xs">Дневник</span>
            </Button>
          </div>
        </Card>

        <Alert>
          <Icon name="Info" className="h-4 w-4" />
          <AlertDescription>
            Обыскивай дом, находи предметы, играй в игры и веселись пока можешь!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default HouseActivities;
