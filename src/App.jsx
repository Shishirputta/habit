import React, { useState, useEffect } from 'react';
import { Sword, Heart, Coins, Users, Plus, Trash2, Check, ShoppingBag, LogOut, X, Skull, Zap, Clock, AlertTriangle } from 'lucide-react';

export default function TaskManager() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState({});
  const [tasks, setTasks] = useState({});
  const [parties, setParties] = useState({});
  const [quests, setQuests] = useState({});
  const [view, setView] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [taskForm, setTaskForm] = useState({ title: '', difficulty: 'easy', deadline: '' });
  const [partyForm, setPartyForm] = useState({ name: '' });
  const [partyTaskForm, setPartyTaskForm] = useState({ title: '', difficulty: 'easy' });
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [ticker, setTicker] = useState(0); // <-- NEW: forces UI refresh every second

  const bossPuzzles = {
    goblin: {
      question: "A goblin has 3 bags of gold. The first bag has 5 coins, the second has 8 coins, and the third has 7 coins. How many coins in total?",
      answer: "20",
      hint: "Add all the coins from the three bags together"
    },
    orc: {
      question: "An orc challenges you: If it takes 5 warriors 5 days to defeat 5 orcs, how many days will it take 10 warriors to defeat 10 orcs?",
      answer: "5",
      hint: "Think about the rate per warrior, not the total number"
    },
    dragon: {
      question: "A dragon guards a treasure. The combination lock has 3 digits. The first digit is 2 times 2, the second is 3 squared, and the third is 4 + 1. What's the code?",
      answer: "495",
      hint: "Calculate: 2×2, 3², and 4+1"
    },
    demon: {
      question: "The Demon Lord asks: 'I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me.' What am I?",
      answer: "fire",
      hint: "Think of something that spreads and needs oxygen"
    }
  };

  const bosses = {
    goblin: { name: 'Goblin Warrior', level: 1, hp: 50, maxHp: 50, attack: 5, defense: 2, xpReward: 50, coinReward: 30, sprite: 'goblin' },
    orc: { name: 'Orc Berserker', level: 3, hp: 100, maxHp: 100, attack: 10, defense: 5, xpReward: 100, coinReward: 60, sprite: 'orc' },
    dragon: { name: 'Ancient Dragon', level: 5, hp: 200, maxHp: 200, attack: 20, defense: 10, xpReward: 200, coinReward: 150, sprite: 'dragon' },
    demon: { name: 'Demon Lord', level: 7, hp: 350, maxHp: 350, attack: 30, defense: 15, xpReward: 350, coinReward: 250, sprite: 'demon' }
  };

  // ──────────────────────────────────────────────────────────────
  // 1. Real-time check every second (instead of every minute)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const id = setInterval(() => {
      checkPenalties();
      setTicker(t => t + 1); // force re-render so overdue UI updates instantly
    }, 1000); // every second

    return () => clearInterval(id);
  }, [currentUser]);

  // ──────────────────────────────────────────────────────────────
  // 2. Also check immediately when tasks or deadline input changes
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      checkPenalties();
    }
  }, [tasks[currentUser], taskForm.deadline]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      saveData();
    }
  }, [users, tasks, parties, quests, currentUser]);

  const penaltyTasks = [
    "Do 20 push-ups",
    "Read 10 pages of a book",
    "Meditate for 5 minutes",
    "Take a 15-minute walk",
    "Drink 2 glasses of water",
    "Clean your desk/workspace",
    "Do 30 jumping jacks",
    "Write in a journal for 10 minutes",
    "Stretch for 10 minutes",
    "Do 15 squats",
    "Tidy up one room",
    "Review your goals"
  ];

  // ──────────────────────────────────────────────────────────────
  // 3. checkPenalties – now shows toast & adds penalty task instantly
  // ──────────────────────────────────────────────────────────────
  const checkPenalties = () => {
    if (!currentUser) return;

    const now = Date.now();
    const userTasks = [...(tasks[currentUser] || [])];
    const user = { ...users[currentUser] };
    let changed = false;

    userTasks.forEach(task => {
      if (!task.completed && task.deadline && task.deadline < now && !task.penaltyApplied) {
        task.penaltyApplied = true;

        const hpLoss = { easy: 5, medium: 10, hard: 15 }[task.difficulty];
        const xpLoss = { easy: 3, medium: 5, hard: 10 }[task.difficulty];

        user.hp = Math.max(0, user.hp - hpLoss);
        user.exp = Math.max(0, user.exp - xpLoss);

        // Toast: missed deadline
        addToast(`Missed "${task.title}"! -${hpLoss} HP, -${xpLoss} XP`, 'error');

        // Add random penalty task
        const randomPenalty = penaltyTasks[Math.floor(Math.random() * penaltyTasks.length)];
        const penaltyTask = {
          id: Date.now() + Math.random(),
          title: `PENALTY: ${randomPenalty}`,
          difficulty: 'easy',
          completed: false,
          isPenalty: true,
          deadline: now + 24 * 60 * 60 * 1000,
        };
        userTasks.push(penaltyTask);

        // Toast: penalty added
        addToast(`Penalty task added: ${randomPenalty}`, 'error');

        changed = true;
      }
    });

    if (changed) {
      setUsers({ ...users, [currentUser]: user });
      setTasks({ ...tasks, [currentUser]: userTasks });
    }
  };

  const loadData = async () => {
    try {
      const results = await Promise.all([
        window.storage.get('users', true).catch(() => null),
        window.storage.get('tasks').catch(() => null),
        window.storage.get('parties', true).catch(() => null),
        window.storage.get('quests', true).catch(() => null),
        window.storage.get('currentUser').catch(() => null)
      ]);

      if (results[0]?.value) setUsers(JSON.parse(results[0].value));
      if (results[1]?.value) setTasks(JSON.parse(results[1].value));
      if (results[2]?.value) setParties(JSON.parse(results[2].value));
      if (results[3]?.value) setQuests(JSON.parse(results[3].value));
      if (results[4]?.value) {
        setCurrentUser(results[4].value);
        setView('tasks');
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        window.storage.set('users', JSON.stringify(users), true),
        window.storage.set('tasks', JSON.stringify(tasks)),
        window.storage.set('parties', JSON.stringify(parties), true),
        window.storage.set('quests', JSON.stringify(quests), true),
        window.storage.set('currentUser', currentUser)
      ]);
    } catch (err) {
      console.error('Error saving data:', err);
    }
  };

  const addToast = (message, type = 'success', coins = 0, exp = 0) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, coins, exp }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleSignup = () => {
    setError('');
    if (!signupForm.username || !signupForm.password) return setError('Please fill in all fields');
    if (signupForm.password !== signupForm.confirmPassword) return setError('Passwords do not match');
    if (users[signupForm.username]) return setError('Username already exists');

    const newUser = {
      username: signupForm.username,
      password: signupForm.password,
      hp: 50,
      maxHp: 50,
      coins: 100,
      level: 1,
      exp: 0,
      inventory: [],
      attack: 10,
      defense: 5
    };

    setUsers({ ...users, [signupForm.username]: newUser });
    setCurrentUser(signupForm.username);
    setTasks({ ...tasks, [signupForm.username]: [] });
    setSignupForm({ username: '', password: '', confirmPassword: '' });
    setView('tasks');
    addToast('Welcome, adventurer! Your quest begins!', 'success');
  };

  const handleLogin = () => {
    setError('');
    if (!users[loginForm.username]) return setError('User not found');
    if (users[loginForm.username].password !== loginForm.password) return setError('Incorrect password');
    setCurrentUser(loginForm.username);
    setLoginForm({ username: '', password: '' });
    setView('tasks');
    addToast('Welcome back, hero!', 'success');
  };

  const handleLogout = async () => {
    try {
      await window.storage.delete('currentUser');
    } catch (err) {
      console.error('Error during logout:', err);
    }
    setCurrentUser(null);
    setView('login');
  };

  const addTask = () => {
    if (!taskForm.title) return;
    const deadlineMs = taskForm.deadline ? new Date(taskForm.deadline).getTime() : null;
    const newTask = { 
      id: Date.now(), 
      title: taskForm.title, 
      difficulty: taskForm.difficulty, 
      completed: false,
      deadline: deadlineMs,
      penaltyApplied: false
    };
    const userTasks = tasks[currentUser] || [];
    setTasks({ ...tasks, [currentUser]: [...userTasks, newTask] });
    setTaskForm({ title: '', difficulty: 'easy', deadline: '' });
    addToast('New quest added!', 'info');
  };

  const completeTask = (taskId) => {
    const userTasks = tasks[currentUser] || [];
    const task = userTasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    const rewards = { easy: 10, medium: 20, hard: 30 };
    const expGain = { easy: 5, medium: 10, hard: 20 };
    
    const updatedUser = { ...users[currentUser] };
    updatedUser.coins += rewards[task.difficulty];
    updatedUser.exp += expGain[task.difficulty];

    if (task.deadline && task.deadline > Date.now()) {
      const bonus = Math.floor(rewards[task.difficulty] * 0.5);
      updatedUser.coins += bonus;
      addToast(`Completed before deadline! +${bonus} bonus coins!`, 'success');
    }

    let leveledUp = false;
    if (updatedUser.exp >= 100) {
      updatedUser.level += 1;
      updatedUser.exp -= 100;
      updatedUser.maxHp += 10;
      updatedUser.hp = updatedUser.maxHp;
      updatedUser.attack += 2;
      updatedUser.defense += 1;
      leveledUp = true;
    }

    const updatedTasks = userTasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
    setUsers({ ...users, [currentUser]: updatedUser });
    setTasks({ ...tasks, [currentUser]: updatedTasks });
    addToast('Quest completed!', 'success', rewards[task.difficulty], expGain[task.difficulty]);
    if (leveledUp) setTimeout(() => addToast(`Level Up! You're now level ${updatedUser.level}!`, 'levelup'), 500);
  };

  const deleteTask = (taskId) => {
    const userTasks = tasks[currentUser] || [];
    setTasks({ ...tasks, [currentUser]: userTasks.filter(t => t.id !== taskId) });
    addToast('Quest removed', 'info');
  };

  const shopItems = [
    { id: 1, name: 'Health Potion', cost: 25, effect: 'hp', value: 15, icon: 'potion' },
    { id: 2, name: 'Sword', cost: 50, effect: 'attack', value: 5, icon: 'sword' },
    { id: 3, name: 'Shield', cost: 50, effect: 'defense', value: 3, icon: 'shield' },
    { id: 4, name: 'Armor', cost: 75, effect: 'defense', value: 5, icon: 'armor' }
  ];

  const ShopItemIcon = ({ type }) => {
    const icons = {
      potion: <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}><rect x="6" y="3" width="4" height="1" fill="#8b4513"/><rect x="7" y="2" width="2" height="1" fill="#8b4513"/><rect x="5" y="4" width="6" height="8" fill="#ff69b4"/><rect x="6" y="5" width="4" height="6" fill="#ff1493"/><rect x="5" y="12" width="6" height="2" fill="#c71585"/><rect x="7" y="6" width="1" height="2" fill="#ffb6c1"/></svg>,
      sword: <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}><rect x="7" y="0" width="2" height="10" fill="#e0e0e0"/><rect x="6" y="1" width="1" height="8" fill="#a0a0a0"/><rect x="5" y="10" width="6" height="1" fill="#ffd700"/><rect x="7" y="11" width="2" height="4" fill="#8b4513"/><rect x="6" y="15" width="4" height="1" fill="#ffd700"/></svg>,
      shield: <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}><rect x="4" y="2" width="8" height="10" fill="#4169e1"/><rect x="5" y="3" width="6" height="8" fill="#6495ed"/><rect x="7" y="6" width="2" height="3" fill="#ffd700"/></svg>,
      armor: <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}><rect x="5" y="2" width="6" height="2" fill="#708090"/><rect x="4" y="4" width="8" height="6" fill="#708090"/><rect x="5" y="5" width="6" height="4" fill="#a9a9a9"/><rect x="7" y="6" width="2" height="2" fill="#ffd700"/></svg>
    };
    return icons[type] || icons.potion;
  };

  const buyItem = (item) => {
    const user = users[currentUser];
    if (user.coins < item.cost) return addToast('Not enough coins!', 'error');

    const updatedUser = { ...user, coins: user.coins - item.cost };
    
    if (item.effect === 'hp') {
      updatedUser.hp = Math.min(updatedUser.hp + item.value, updatedUser.maxHp);
      addToast(`Purchased ${item.name}! HP restored!`, 'success');
    } else if (item.effect === 'attack') {
      updatedUser.attack += item.value;
      updatedUser.inventory = [...updatedUser.inventory, item.name];
      addToast(`Purchased ${item.name}! Attack +${item.value}!`, 'success');
    } else if (item.effect === 'defense') {
      updatedUser.defense += item.value;
      updatedUser.inventory = [...updatedUser.inventory, item.name];
      addToast(`Purchased ${item.name}! Defense +${item.value}!`, 'success');
    }
    setUsers({ ...users, [currentUser]: updatedUser });
  };

  const createParty = () => {
    if (!partyForm.name) return;
    const partyId = Date.now().toString();
    const newParty = {
      id: partyId,
      name: partyForm.name,
      leader: currentUser,
      members: [currentUser],
      tasks: [],
      quests: []
    };
    setParties({ ...parties, [partyId]: newParty });
    setPartyForm({ name: '' });
    addToast('Party created! Gather your allies!', 'success');
  };

  const joinParty = (partyId) => {
    const party = parties[partyId];
    if (party.members.includes(currentUser)) return addToast('Already in this party!', 'error');
    
    const updatedParty = { ...party, members: [...party.members, currentUser] };
    setParties({ ...parties, [partyId]: updatedParty });
    addToast(`Joined ${party.name}!`, 'success');
  };

  const startQuest = (bossType, isParty = false, partyId = null) => {
    const boss = { ...bosses[bossType] };
    const puzzle = { ...bossPuzzles[bossType] };
    const questId = Date.now().toString();
    
    const newQuest = {
      id: questId,
      bossType: bossType,
      boss: boss,
      puzzle: puzzle,
      isParty: isParty,
      partyId: partyId,
      participants: isParty ? (parties[partyId]?.members || []) : [currentUser],
      active: true,
      attempts: 0,
      createdAt: Date.now()
    };

    setQuests({ ...quests, [questId]: newQuest });
    setActiveBattle(questId);
    setPuzzleAnswer('');
    setView('battle');
  };

  const solvePuzzle = () => {
    if (!activeBattle) return;
    
    const quest = quests[activeBattle];
    const user = users[currentUser];
    const boss = quest.boss;
    const puzzle = quest.puzzle;

    quest.attempts += 1;

    if (puzzleAnswer.toLowerCase().trim() === puzzle.answer.toLowerCase()) {
      const updatedUser = { ...user, coins: user.coins + boss.coinReward, exp: user.exp + boss.xpReward };
      let leveledUp = false;
      while (updatedUser.exp >= 100) {
        updatedUser.level += 1;
        updatedUser.exp -= 100;
        updatedUser.maxHp += 10;
        updatedUser.hp = updatedUser.maxHp;
        updatedUser.attack += 2;
        updatedUser.defense += 1;
        leveledUp = true;
      }
      
      setUsers({ ...users, [currentUser]: updatedUser });
      addToast('Puzzle solved! Boss defeated!', 'success', boss.coinReward, boss.xpReward);
      if (leveledUp) setTimeout(() => addToast(`Level Up! You're now level ${updatedUser.level}!`, 'levelup'), 500);
      
      setTimeout(() => {
        setActiveBattle(null);
        setPuzzleAnswer('');
        setView('quests');
      }, 2000);
    } else {
      const damage = Math.floor(boss.attack * 0.3);
      const updatedUser = { ...user, hp: Math.max(0, user.hp - damage) };
      setUsers({ ...users, [currentUser]: updatedUser });
      addToast(`Wrong answer! The boss strikes you for ${damage} damage!`, 'error');
      
      if (updatedUser.hp <= 0) {
        addToast('You have been defeated...', 'error');
        setTimeout(() => {
          setActiveBattle(null);
          setPuzzleAnswer('');
          setView('quests');
        }, 2000);
      }
    }
    
    setQuests({ ...quests, [activeBattle]: quest });
  };

  const BossSprite = ({ type }) => {
    const sprites = {
      goblin: <svg width="128" height="128" viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}><rect x="12" y="8" width="8" height="8" fill="#228b22"/><rect x="10" y="10" width="12" height="6" fill="#228b22"/><rect x="13" y="11" width="2" height="2" fill="#ff0000"/><rect x="17" y="11" width="2" height="2" fill="#ff0000"/><rect x="12" y="16" width="8" height="8" fill="#2e7d32"/><rect x="13" y="24" width="2" height="4" fill="#1b5e20"/><rect x="17" y="24" width="2" height="4" fill="#1b5e20"/></svg>,
      orc: <svg width="128" height="128" viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}><rect x="11" y="6" width="10" height="10" fill="#556b2f"/><rect x="12" y="9" width="2" height="2" fill="#8b0000"/><rect x="18" y="9" width="2" height="2" fill="#8b0000"/><rect x="10" y="16" width="12" height="8" fill="#6b8e23"/><rect x="11" y="24" width="3" height="6" fill="#4a4a4a"/><rect x="18" y="24" width="3" height="6" fill="#4a4a4a"/></svg>,
      dragon: <svg width="128" height="128" viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}><rect x="10" y="4" width="12" height="12" fill="#8b0000"/><rect x="12" y="7" width="2" height="2" fill="#ffd700"/><rect x="18" y="7" width="2" height="2" fill="#ffd700"/><rect x="6" y="8" width="2" height="4" fill="#ff4500"/><rect x="24" y="8" width="2" height="4" fill="#ff4500"/><rect x="9" y="16" width="14" height="8" fill="#a52a2a"/><rect x="11" y="24" width="3" height="6" fill="#4a4a4a"/><rect x="18" y="24" width="3" height="6" fill="#4a4a4a"/></svg>,
      demon: <svg width="128" height="128" viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}><rect x="6" y="4" width="4" height="6" fill="#4a0000"/><rect x="22" y="4" width="4" height="6" fill="#4a0000"/><rect x="10" y="6" width="12" height="12" fill="#2d0000"/><rect x="12" y="9" width="2" height="2" fill="#ff0000"/><rect x="18" y="9" width="2" height="2" fill="#ff0000"/><rect x="9" y="18" width="14" height="8" fill="#1a0000"/><rect x="11" y="26" width="3" height="6" fill="#4a4a4a"/><rect x="18" y="26" width="3" height="6" fill="#4a4a4a"/></svg>
    };
    return sprites[type] || sprites.goblin;
  };

  const user = currentUser ? users[currentUser] : null;
  const userParties = currentUser ? Object.values(parties).filter(p => p.members.includes(currentUser)) : [];
  const availableParties = currentUser ? Object.values(parties).filter(p => !p.members.includes(currentUser)) : [];

  const PixelAvatar = ({ level }) => (
    <svg width="64" height="64" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="2" width="8" height="6" fill="#ffdbac"/><rect x="4" y="2" width="8" height="2" fill="#8b4513"/><rect x="6" y="4" width="1" height="1" fill="#000"/><rect x="9" y="4" width="1" height="1" fill="#000"/><rect x="5" y="8" width="6" height="4" fill={level > 5 ? '#9333ea' : '#6b7280'}/><rect x="4" y="8" width="1" height="3" fill="#ffdbac"/><rect x="11" y="8" width="1" height="3" fill="#ffdbac"/><rect x="6" y="12" width="2" height="3" fill="#4b5563"/><rect x="8" y="12" width="2" height="3" fill="#4b5563"/>
      {level > 3 && <rect x="12" y="7" width="1" height="4" fill="#c0c0c0"/>}{level > 3 && <rect x="11" y="7" width="3" height="1" fill="#ffd700"/>}
    </svg>
  );

  const PixelCoin = () => <svg width="24" height="24" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}><rect x="2" y="1" width="4" height="6" fill="#ffd700"/><rect x="1" y="2" width="6" height="4" fill="#ffd700"/><rect x="3" y="2" width="2" height="4" fill="#ffed4e"/></svg>;
  const PixelHeart = () => <svg width="24" height="24" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}><rect x="1" y="1" width="2" height="2" fill="#ef4444"/><rect x="5" y="1" width="2" height="2" fill="#ef4444"/><rect x="0" y="2" width="8" height="3" fill="#ef4444"/><rect x="1" y="5" width="6" height="1" fill="#ef4444"/><rect x="2" y="6" width="4" height="1" fill="#ef4444"/><rect x="3" y="7" width="2" height="1" fill="#ef4444"/></svg>;
  const PixelStar = () => <svg width="24" height="24" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}><rect x="3" y="0" width="2" height="2" fill="#3b82f6"/><rect x="2" y="2" width="4" height="1" fill="#3b82f6"/><rect x="1" y="3" width="6" height="2" fill="#3b82f6"/></svg>;

  if (view === 'battle' && activeBattle) {
    const quest = quests[activeBattle];
    const boss = quest.boss;
    const puzzle = quest.puzzle;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black bg-opacity-70 rounded-lg p-6 border-4 border-purple-600">
            <h1 className="text-3xl font-bold text-purple-400 text-center mb-4">PUZZLE CHALLENGE</h1>
            
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div className="text-center">
                <PixelAvatar level={user.level} />
                <h3 className="text-xl font-bold text-white mt-2">{user.username}</h3>
                <div className="mt-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <PixelHeart />
                    <div className="bg-gray-700 rounded-full h-6 w-full max-w-xs">
                      <div className="bg-red-500 h-6 rounded-full transition-all duration-500" style={{ width: `${(user.hp / user.maxHp) * 100}%` }}>
                        <span className="text-white text-xs font-bold flex items-center justify-center h-full">{user.hp}/{user.maxHp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <BossSprite type={quest.bossType} />
                <h3 className="text-xl font-bold text-red-400 mt-2">{boss.name}</h3>
                <p className="text-sm text-yellow-400">Level {boss.level}</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-4 border-2 border-yellow-600">
              <h3 className="text-xl font-bold text-yellow-400 mb-3">{boss.name}'s Riddle:</h3>
              <p className="text-lg text-white mb-4">{puzzle.question}</p>
              
              {quest.attempts > 2 && (
                <div className="bg-blue-900 p-3 rounded mb-3 border border-blue-500">
                  <p className="text-sm text-blue-200"><strong>Hint:</strong> {puzzle.hint}</p>
                </div>
              )}
              
              <p className="text-sm text-gray-400 mb-3">Attempts: {quest.attempts} | Wrong answers deal damage!</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={puzzleAnswer}
                  onChange={(e) => setPuzzleAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle()}
                  placeholder="Enter your answer..."
                  className="flex-1 px-4 py-3 bg-gray-800 border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={solvePuzzle}
                  disabled={!puzzleAnswer.trim() || user.hp <= 0}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg"
                >
                  Submit
                </button>
              </div>
            </div>

            <button
              onClick={() => { setActiveBattle(null); setPuzzleAnswer(''); setView('quests'); }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Retreat
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
          }
          .float-animation { animation: float 3s ease-in-out infinite; }
          .float-animation-delayed { animation: float 4s ease-in-out infinite 1s; }
          .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
          .glitter-bg::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              radial-gradient(2px 2px at 20% 30%, white, transparent),
              radial-gradient(2px 2px at 60% 70%, white, transparent),
              radial-gradient(1px 1px at 50% 50%, white, transparent),
              radial-gradient(1px 1px at 80% 10%, white, transparent),
              radial-gradient(2px 2px at 90% 60%, white, transparent);
            background-size: 200% 200%;
            animation: sparkle 3s ease-in-out infinite;
            pointer-events: none;
          }
        `}</style>
        
        <div className="glitter-bg absolute inset-0"></div>

        <div className="absolute top-10 left-10 float-animation"><PixelCoin /></div>
        <div className="absolute top-20 right-20 float-animation-delayed"><PixelStar /></div>
        <div className="absolute bottom-20 left-20 float-animation"><PixelHeart /></div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border-4 border-yellow-500">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 relative">
              <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-50 pulse-glow"></div>
              <svg width="100" height="100" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} className="relative z-10">
                <rect x="7" y="0" width="2" height="10" fill="#e0e0e0" />
                <rect x="5" y="10" width="6" height="1" fill="#ffd700" />
                <rect x="7" y="11" width="2" height="4" fill="#8b4513" />
                <rect x="6" y="15" width="4" height="1" fill="#ffd700" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">Quest Manager</h1>
            <p className="text-gray-600 text-lg font-semibold">Gamify Your Life</p>
          </div>

          {error && <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 font-semibold">{error}</div>}

          {view === 'login' ? (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">Enter Your Realm</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                  <input type="text" placeholder="Your hero name" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                  <input type="password" placeholder="Secret spell" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <button onClick={handleLogin} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 font-bold text-lg shadow-lg transform transition hover:scale-105">Begin Quest</button>
                <div className="text-center">
                  <span className="text-gray-600">New adventurer? </span>
                  <button onClick={() => setView('signup')} className="text-purple-600 font-bold hover:text-purple-800 underline">Create Your Hero</button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">Create Your Hero</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hero Name</label>
                  <input type="text" placeholder="Choose your hero name" value={signupForm.username} onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })} className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Secret Spell</label>
                  <input type="password" placeholder="Create your password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Spell</label>
                  <input type="password" placeholder="Confirm your password" value={signupForm.confirmPassword} onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <button onClick={handleSignup} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 font-bold text-lg shadow-lg transform transition hover:scale-105">Start Adventure</button>
                <div className="text-center">
                  <span className="text-gray-600">Already have a hero? </span>
                  <button onClick={() => setView('login')} className="text-purple-600 font-bold hover:text-purple-800 underline">Login Here</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 p-4 rounded-lg shadow-lg animate-slide-in ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : toast.type === 'levelup' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-blue-500'} text-white min-w-[300px]`}>
            <div className="flex-1">
              <p className="font-bold">{toast.message}</p>
              {toast.coins > 0 && <div className="flex items-center gap-2 mt-1"><PixelCoin /><span className="text-sm">+{toast.coins} coins</span></div>}
              {toast.exp > 0 && <div className="flex items-center gap-2 mt-1"><PixelStar /><span className="text-sm">+{toast.exp} XP</span></div>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-white hover:text-gray-200"><X className="w-5 h-5" /></button>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <PixelAvatar level={user.level} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{user.username}</h1>
                <p className="text-gray-600">Level {user.level} Adventurer</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"><LogOut className="w-4 h-4" />Logout</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <PixelHeart />
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-6">
                  <div className="bg-red-500 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300" style={{ width: `${(user.hp / user.maxHp) * 100}%` }}>{user.hp}/{user.maxHp}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PixelStar />
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-6">
                  <div className="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300" style={{ width: `${user.exp}%` }}>{user.exp}/100</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PixelCoin />
              <span className="text-xl font-bold text-gray-800">{user.coins}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setView('tasks')} className={`px-4 py-2 rounded transition-all ${view === 'tasks' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>My Tasks</button>
            <button onClick={() => setView('shop')} className={`px-4 py-2 rounded transition-all ${view === 'shop' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Shop</button>
            <button onClick={() => setView('party')} className={`px-4 py-2 rounded transition-all ${view === 'party' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Party</button>
            <button onClick={() => setView('quests')} className={`px-4 py-2 rounded transition-all ${view === 'quests' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Boss Quests</button>
          </div>
        </div>

        {view === 'tasks' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">My Tasks</h2>
            <div className="flex gap-2 mb-4 flex-wrap">
              <input type="text" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="flex-1 min-w-[200px] px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <select value={taskForm.difficulty} onChange={(e) => setTaskForm({ ...taskForm, difficulty: e.target.value })} className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <input type="datetime-local" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <button onClick={addTask} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Regular Tasks</h3>
                <div className="space-y-2">
                  {(tasks[currentUser] || []).filter(t => !t.isPenalty).map(task => {
                    const isOverdue = task.deadline && task.deadline < Date.now() && !task.completed;
                    return (
                      <div key={task.id} className={`flex items-center justify-between p-4 rounded transition-all ${task.completed ? 'bg-green-100' : isOverdue ? 'bg-red-100 border-2 border-red-400' : 'bg-gray-100'}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <button onClick={() => completeTask(task.id)} disabled={task.completed} className={`w-6 h-6 rounded transition-all ${task.completed ? 'bg-green-500' : 'bg-white border-2 border-gray-400 hover:border-green-500'} flex items-center justify-center`}>
                            {task.completed && <Check className="w-4 h-4 text-white" />}
                          </button>
                          <div className="flex-1">
                            <p className={task.completed ? 'line-through' : ''}>{task.title}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded ${task.difficulty === 'easy' ? 'bg-green-200' : task.difficulty === 'medium' ? 'bg-yellow-200' : 'bg-red-200'}`}>{task.difficulty}</span>
                              {task.deadline && (
                                <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isOverdue ? 'bg-red-500 text-white' : 'bg-blue-200'}`}>
                                  <Clock className="w-3 h-3" />
                                  {isOverdue ? 'OVERDUE!' : new Date(task.deadline).toLocaleString()}
                                </span>
                              )}
                              {isOverdue && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2 text-orange-600">Penalty Tasks</h3>
                <div className="space-y-2">
                  {(tasks[currentUser] || []).filter(t => t.isPenalty).map(task => {
                    const isOverdue = task.deadline && task.deadline < Date.now() && !task.completed;
                    return (
                      <div key={task.id} className={`flex items-center justify-between p-4 rounded transition-all ${task.completed ? 'bg-green-100' : 'bg-orange-100 border-2 border-orange-500'}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <button onClick={() => completeTask(task.id)} disabled={task.completed} className={`w-6 h-6 rounded transition-all ${task.completed ? 'bg-green-500' : 'bg-white border-2 border-gray-400 hover:border-green-500'} flex items-center justify-center`}>
                            {task.completed && <Check className="w-4 h-4 text-white" />}
                          </button>
                          <div className="flex-1">
                            <p className={task.completed ? 'line-through' : ''}>{task.title}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded ${task.difficulty === 'easy' ? 'bg-green-200' : task.difficulty === 'medium' ? 'bg-yellow-200' : 'bg-red-200'}`}>{task.difficulty}</span>
                              <span className="text-xs px-2 py-1 rounded bg-orange-500 text-white font-bold">PENALTY TASK</span>
                              {task.deadline && (
                                <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isOverdue ? 'bg-red-500 text-white' : 'bg-blue-200'}`}>
                                  <Clock className="w-3 h-3" />
                                  {isOverdue ? 'OVERDUE!' : new Date(task.deadline).toLocaleString()}
                                </span>
                              )}
                              {isOverdue && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'shop' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Shop</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shopItems.map(item => (
                <div key={item.id} className="border-2 border-purple-200 rounded-lg p-4 hover:shadow-xl hover:border-purple-400 transition-all bg-gradient-to-br from-white to-purple-50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-purple-100 rounded-lg p-2"><ShopItemIcon type={item.icon} /></div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-purple-800">{item.name}</h3>
                      <p className="text-gray-600 text-sm">{item.effect === 'hp' ? `Restores ${item.value} HP` : item.effect === 'attack' ? `+${item.value} Attack` : `+${item.value} Defense`}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-yellow-600 font-bold text-lg"><PixelCoin />{item.cost}</span>
                    <button onClick={() => buyItem(item)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-md transform hover:scale-105">Buy Now</button>
                  </div>
                </div>
              ))}
            </div>
            {user.inventory.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
                <h3 className="text-xl font-bold mb-3 text-purple-800">Your Inventory</h3>
                <div className="flex gap-2 flex-wrap">
                  {user.inventory.map((item, i) => <span key={i} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold shadow-md">{item}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'party' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Party System</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Create New Party</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Party name" value={partyForm.name} onChange={(e) => setPartyForm({ name: e.target.value })} className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button onClick={createParty} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"><Users className="w-5 h-5" />Create</button>
              </div>
            </div>
            
            {availableParties.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Available Parties to Join</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableParties.map(party => (
                    <div key={party.id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-lg text-blue-800">{party.name}</h4>
                          <p className="text-sm text-gray-600">Leader: {party.leader}</p>
                          <p className="text-sm text-gray-600">Members: {party.members.length}</p>
                          <p className="text-sm text-gray-600">Active Quests: {party.tasks.length}</p>
                        </div>
                        <button onClick={() => joinParty(party.id)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 font-semibold">
                          <Plus className="w-4 h-4" />
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {userParties.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Your Parties</h3>
                {userParties.map(party => {
                  const isLeader = party.leader === currentUser;
                  return (
                    <div key={party.id} className="border rounded-lg p-4 mb-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold">{party.name}</h3>
                        {isLeader && <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">LEADER</span>}
                      </div>
                      <p className="text-gray-600 mb-2">Leader: {party.leader}</p>
                      <div className="mb-3">
                        <h4 className="font-semibold mb-1">Members ({party.members.length}):</h4>
                        <div className="flex gap-2 flex-wrap">
                          {party.members.map(member => (
                            <span key={member} className={`px-3 py-1 rounded text-sm ${member === party.leader ? 'bg-yellow-200 border-2 border-yellow-400 font-bold' : 'bg-purple-200'}`}>
                              {member === party.leader ? '' : ''}{member}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {isLeader && (
                        <div className="mb-4 bg-white p-3 rounded border-2 border-purple-300">
                          <h4 className="font-semibold mb-2 text-purple-700">Leader: Add Party Quest</h4>
                          <div className="flex gap-2 flex-wrap">
                            <input type="text" placeholder="Party quest title" value={partyTaskForm.title} onChange={(e) => setPartyTaskForm({ ...partyTaskForm, title: e.target.value })} className="flex-1 min-w-[200px] px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            <select value={partyTaskForm.difficulty} onChange={(e) => setPartyTaskForm({ ...partyTaskForm, difficulty: e.target.value })} className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                            <button onClick={() => addPartyTask(party.id)} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Party Quests ({party.tasks.length})</h4>
                        {party.tasks.length === 0 ? (
                          <p className="text-gray-500 text-sm italic">No party quests yet. {isLeader ? 'Add one above!' : 'Wait for the leader to add quests.'}</p>
                        ) : (
                          <div className="space-y-2">
                            {party.tasks.map(task => {
                              const allCompleted = task.completedBy.length === party.members.length;
                              const userCompleted = task.completedBy.includes(currentUser);
                              return (
                                <div key={task.id} className={`flex items-center justify-between p-3 rounded ${allCompleted ? 'bg-green-200 border-2 border-green-500' : 'bg-gray-100'}`}>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{task.title}</p>
                                      {allCompleted && <span className="text-xs px-2 py-1 bg-green-500 text-white rounded font-bold">QUEST COMPLETE!</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-xs px-2 py-1 rounded ${task.difficulty === 'easy' ? 'bg-green-200' : task.difficulty === 'medium' ? 'bg-yellow-200' : 'bg-red-200'}`}>{task.difficulty}</span>
                                      <span className="text-xs text-gray-600">Completed by: {task.completedBy.length}/{party.members.length} members</span>
                                    </div>
                                    {task.completedBy.length > 0 && (
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {task.completedBy.map(member => (
                                          <span key={member} className="text-xs px-2 py-1 bg-blue-100 rounded">{member}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <button onClick={() => completePartyTask(party.id, task.id)} disabled={userCompleted} className={`px-3 py-1 rounded ml-2 ${userCompleted ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                                    {userCompleted ? 'Done' : 'Complete'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'quests' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Boss Puzzle Quests</h2>
            <p className="text-gray-600 mb-4">Defeat bosses by solving their riddles! Wrong answers will damage you.</p>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Solo Quests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(bosses).map(([key, boss]) => (
                  <div key={key} className="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="scale-75"><BossSprite type={boss.sprite} /></div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{boss.name}</h4>
                        <p className="text-sm text-gray-600">Level {boss.level}</p>
                        <p className="text-sm text-yellow-600 font-semibold">Rewards: {boss.coinReward} | {boss.xpReward}</p>
                      </div>
                    </div>
                    <button onClick={() => startQuest(key, false)} className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold">Challenge Puzzle</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
