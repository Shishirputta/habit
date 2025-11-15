import React, { useState, useEffect } from 'react';
import {
  Sword, Heart, Coins, Users, Plus, Trash2, Check, ShoppingBag,
  LogOut, X, Zap, Skull
} from 'lucide-react';

export default function TaskManager() {
  /* --------------------- STATE --------------------- */
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState({});
  const [tasks, setTasks] = useState({});
  const [parties, setParties] = useState({});
  const [quests, setQuests] = useState({});          // <-- NEW
  const [view, setView] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [taskForm, setTaskForm] = useState({ title: '', difficulty: 'easy' });
  const [partyForm, setPartyForm] = useState({ name: '' });
  const [partyTaskForm, setPartyTaskForm] = useState({ title: '', difficulty: 'easy' });
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null); // <-- NEW
  const [battleLog, setBattleLog] = useState([]);        // <-- NEW

  /* --------------------- DATA LOAD / SAVE --------------------- */
  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (currentUser) saveData();
  }, [users, tasks, parties, quests, currentUser]);

  const loadData = async () => {
    try {
      const [
        usersResult, tasksResult, partiesResult,
        questsResult, currentUserResult
      ] = await Promise.all([
        window.storage.get('users').catch(() => null),
        window.storage.get('tasks').catch(() => null),
        window.storage.get('parties').catch(() => null),
        window.storage.get('quests').catch(() => null),
        window.storage.get('currentUser').catch(() => null)
      ]);

      if (usersResult?.value) setUsers(JSON.parse(usersResult.value));
      if (tasksResult?.value) setTasks(JSON.parse(tasksResult.value));
      if (partiesResult?.value) setParties(JSON.parse(partiesResult.value));
      if (questsResult?.value) setQuests(JSON.parse(questsResult.value));
      if (currentUserResult?.value) {
        setCurrentUser(currentUserResult.value);
        setView('tasks');
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        window.storage.set('users', JSON.stringify(users)),
        window.storage.set('tasks', JSON.stringify(tasks)),
        window.storage.set('parties', JSON.stringify(parties)),
        window.storage.set('quests', JSON.stringify(quests)),
        window.storage.set('currentUser', currentUser)
      ]);
    } catch (err) {
      console.error('Error saving data:', err);
    }
  };

  /* --------------------- TOASTS --------------------- */
  const addToast = (message, type = 'success', coins = 0, exp = 0) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, coins, exp }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  /* --------------------- AUTH --------------------- */
  const handleSignup = () => {
    setError('');
    if (!signupForm.username || !signupForm.password) { setError('Please fill in all fields'); return; }
    if (signupForm.password !== signupForm.confirmPassword) { setError('Passwords do not match'); return; }
    if (users[signupForm.username]) { setError('Username already exists'); return; }

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
    if (!users[loginForm.username]) { setError('User not found'); return; }
    if (users[loginForm.username].password !== loginForm.password) { setError('Incorrect password'); return; }

    setCurrentUser(loginForm.username);
    setLoginForm({ username: '', password: '' });
    setView('tasks');
    addToast('Welcome back, hero!', 'success');
  };

  const handleLogout = async () => {
    try { await window.storage.delete('currentUser'); } catch (e) { console.error(e); }
    setCurrentUser(null);
    setView('login');
  };

  /* --------------------- TASKS --------------------- */
  const addTask = () => {
    if (!taskForm.title) return;
    const newTask = { id: Date.now(), title: taskForm.title, difficulty: taskForm.difficulty, completed: false };
    const userTasks = tasks[currentUser] || [];
    setTasks({ ...tasks, [currentUser]: [...userTasks, newTask] });
    setTaskForm({ title: '', difficulty: 'easy' });
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
    if (leveledUp) {
      setTimeout(() => addToast(`Level Up! Level ${updatedUser.level}!`, 'levelup'), 500);
    }
  };

  const deleteTask = (taskId) => {
    const userTasks = tasks[currentUser] || [];
    setTasks({ ...tasks, [currentUser]: userTasks.filter(t => t.id !== taskId) });
    addToast('Quest removed', 'info');
  };

  /* --------------------- SHOP --------------------- */
  const shopItems = [
    { id: 1, name: 'Health Potion', cost: 25, effect: 'hp', value: 15, icon: 'potion' },
    { id: 2, name: 'Sword', cost: 50, effect: 'item', value: 'Sword', icon: 'sword' },
    { id: 3, name: 'Shield', cost: 50, effect: 'item', value: 'Shield', icon: 'shield' },
    { id: 4, name: 'Armor', cost: 75, effect: 'item', value: 'Armor', icon: 'armor' }
  ];

  const ShopItemIcon = ({ type }) => {
    const icons = {
      potion: (
        <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
          <rect x="6" y="3" width="4" height="1" fill="#8b4513" />
          <rect x="7" y="2" width="2" height="1" fill="#8b4513" />
          <rect x="5" y="4" width="6" height="8" fill="#ff69b4" />
          <rect x="6" y="5" width="4" height="6" fill="#ff1493" />
          <rect x="5" y="12" width="6" height="2" fill="#c71585" />
          <rect x="7" y="6" width="1" height="2" fill="#ffb6c1" />
        </svg>
      ),
      sword: (
        <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
          <rect x="7" y="0" width="2" height="10" fill="#e0e0e0" />
          <rect x="6" y="1" width="1" height="8" fill="#a0a0a0" />
          <rect x="5" y="10" width="6" height="1" fill="#ffd700" />
          <rect x="4" y="10" width="8" height="1" fill="#ffed4e" />
          <rect x="7" y="11" width="2" height="4" fill="#8b4513" />
          <rect x="6" y="15" width="4" height="1" fill="#ffd700" />
          <rect x="7" y="2" width="2" height="1" fill="#fff" />
        </svg>
      ),
      shield: (
        <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
          <rect x="4" y="2" width="8" height="10" fill="#4169e1" />
          <rect x="3" y="4" width="10" height="6" fill="#4169e1" />
          <rect x="5" y="3" width="6" height="8" fill="#6495ed" />
          <rect x="6" y="5" width="4" height="1" fill="#ffd700" />
          <rect x="7" y="6" width="2" height="3" fill="#ffd700" />
          <rect x="6" y="9" width="4" height="1" fill="#ffd700" />
        </svg>
      ),
      armor: (
        <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
          <rect x="5" y="2" width="6" height="2" fill="#708090" />
          <rect x="4" y="4" width="8" height="6" fill="#708090" />
          <rect x="5" y="5" width="6" height="4" fill="#a9a9a9" />
          <rect x="3" y="6" width="2" height="4" fill="#708090" />
          <rect x="11" y="6" width="2" height="4" fill="#708090" />
          <rect x="5" y="10" width="6" height="2" fill="#708090" />
          <rect x="7" y="6" width="2" height="2" fill="#ffd700" />
        </svg>
      )
    };
    return icons[type] || icons.potion;
  };

  const buyItem = (item) => {
    const user = users[currentUser];
    if (user.coins < item.cost) { addToast('Not enough coins!', 'error'); return; }

    const updatedUser = { ...user, coins: user.coins - item.cost };
    if (item.effect === 'hp') {
      updatedUser.hp = Math.min(updatedUser.hp + item.value, updatedUser.maxHp);
      addToast(`Purchased ${item.name}! HP restored!`, 'success');
    } else if (item.effect === 'item') {
      updatedUser.inventory = [...updatedUser.inventory, item.value];
      addToast(`Purchased ${item.name}! Added to inventory!`, 'success');
    }
    setUsers({ ...users, [currentUser]: updatedUser });
  };

  /* --------------------- PARTY --------------------- */
  const createParty = () => {
    if (!partyForm.name) return;
    const partyId = Date.now().toString();
    const newParty = {
      id: partyId,
      name: partyForm.name,
      leader: currentUser,
      members: [currentUser],
      tasks: []
    };
    setParties({ ...parties, [partyId]: newParty });
    setPartyForm({ name: '' });
    addToast('Party created! Gather your allies!', 'success');
  };

  const addPartyTask = (partyId) => {
    if (!partyTaskForm.title) return;
    const newTask = {
      id: Date.now(),
      title: partyTaskForm.title,
      difficulty: partyTaskForm.difficulty,
      completedBy: []
    };
    const updatedParty = { ...parties[partyId] };
    updatedParty.tasks = [...updatedParty.tasks, newTask];
    setParties({ ...parties, [partyId]: updatedParty });
    setPartyTaskForm({ title: '', difficulty: 'easy' });
    addToast('Party quest added!', 'info');
  };

  const completePartyTask = (partyId, taskId) => {
    const party = parties[partyId];
    const task = party.tasks.find(t => t.id === taskId);
    if (task.completedBy.includes(currentUser)) return;

    const rewards = { easy: 15, medium: 30, hard: 50 };
    const expGain = { easy: 10, medium: 20, hard: 30 };

    const updatedUser = { ...users[currentUser] };
    updatedUser.coins += rewards[task.difficulty];
    updatedUser.exp += expGain[task.difficulty];

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

    const updatedParty = { ...party };
    updatedParty.tasks = party.tasks.map(t =>
      t.id === taskId ? { ...t, completedBy: [...t.completedBy, currentUser] } : t
    );

    setUsers({ ...users, [currentUser]: updatedUser });
    setParties({ ...parties, [partyId]: updatedParty });

    addToast('Party quest completed!', 'success', rewards[task.difficulty], expGain[task.difficulty]);
    if (leveledUp) {
      setTimeout(() => addToast(`Level Up! Level ${updatedUser.level}!`, 'levelup'), 500);
    }
  };

  /* --------------------- BOSS DUNGEON --------------------- */
  const bosses = {
    goblin: {
      name: 'Goblin Warrior',
      level: 1,
      hp: 50,
      maxHp: 50,
      attack: 8,
      defense: 2,
      xpReward: 50,
      coinReward: 30,
      sprite: 'goblin'
    },
    orc: {
      name: 'Orc Berserker',
      level: 3,
      hp: 100,
      maxHp: 100,
      attack: 15,
      defense: 5,
      xpReward: 100,
      coinReward: 60,
      sprite: 'orc'
    },
    dragon: {
      name: 'Ancient Dragon',
      level: 5,
      hp: 200,
      maxHp: 200,
      attack: 25,
      defense: 10,
      xpReward: 200,
      coinReward: 150,
      sprite: 'dragon'
    },
    demon: {
      name: 'Demon Lord',
      level: 7,
      hp: 350,
      maxHp: 350,
      attack: 35,
      defense: 15,
      xpReward: 350,
      coinReward: 250,
      sprite: 'demon'
    }
  };

  const startQuest = (bossType) => {
    const boss = { ...bosses[bossType] };
    const questId = Date.now().toString();

    const newQuest = { id: questId, boss, active: true, createdAt: Date.now() };
    setQuests({ ...quests, [questId]: newQuest });
    setActiveBattle(questId);
    setBattleLog([`Battle started against ${boss.name}!`]);
    setView('battle');
  };

  const attackBoss = () => {
    if (!activeBattle) return;
    const quest = quests[activeBattle];
    const userData = users[currentUser];
    const boss = quest.boss;

    // Player attack
    const playerDmg = Math.max(1, (userData.attack || 10) - boss.defense + Math.floor(Math.random() * 8));
    boss.hp -= playerDmg;
    setBattleLog(prev => [...prev, `${currentUser} attacks for ${playerDmg} damage!`]);

    if (boss.hp <= 0) {
      boss.hp = 0;
      const updatedUser = { ...userData };
      updatedUser.coins += boss.coinReward;
      updatedUser.exp += boss.xpReward;
      updatedUser.hp = Math.min(updatedUser.hp + 20, updatedUser.maxHp);

      while (updatedUser.exp >= 100) {
        updatedUser.level += 1;
        updatedUser.exp -= 100;
        updatedUser.maxHp += 10;
        updatedUser.hp = updatedUser.maxHp;
        updatedUser.attack = (updatedUser.attack || 10) + 3;
        updatedUser.defense = (updatedUser.defense || 5) + 1;
      }

      setUsers({ ...users, [currentUser]: updatedUser });
      setBattleLog(prev => [...prev, `${boss.name} defeated!`, `Rewards: ${boss.coinReward} coins + ${boss.xpReward} XP`]);
      addToast('Boss defeated! Victory!', 'success', boss.coinReward, boss.xpReward);

      setTimeout(() => {
        setActiveBattle(null);
        setBattleLog([]);
        setQuests(prev => {
          const copy = { ...prev };
          delete copy[quest.id];
          return copy;
        });
        setView('dungeon');
      }, 2500);
      return;
    }

    // Boss counter-attack
    setTimeout(() => {
      const bossDmg = Math.max(1, boss.attack - (userData.defense || 5) + Math.floor(Math.random() * 6));
      const updatedUser = { ...userData };
      updatedUser.hp -= bossDmg;

      setBattleLog(prev => [...prev, `${boss.name} counterattacks for ${bossDmg} damage!`]);

      if (updatedUser.hp <= 0) {
        updatedUser.hp = 0;
        setUsers({ ...users, [currentUser]: updatedUser });
        setBattleLog(prev => [...prev, 'You have been defeated...']);
        addToast('Defeated! Heal up and try again!', 'error');
        setTimeout(() => {
          setActiveBattle(null);
          setBattleLog([]);
          setView('dungeon');
        }, 2000);
        return;
      }

      setUsers({ ...users, [currentUser]: updatedUser });
      quest.boss = boss;
      setQuests({ ...quests, [activeBattle]: quest });
    }, 1000);
  };

  const fleeBattle = () => {
    setActiveBattle(null);
    setBattleLog([]);
    setView('dungeon');
    addToast('Fled from battle!', 'info');
  };

  /* --------------------- PIXEL COMPONENTS --------------------- */
  const PixelAvatar = ({ level }) => (
    <svg width="64" height="64" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="2" width="8" height="6" fill="#ffdbac" />
      <rect x="4" y="2" width="8" height="2" fill="#8b4513" />
      <rect x="6" y="4" width="1" height="1" fill="#000" />
      <rect x="9" y="4" width="1" height="1" fill="#000" />
      <rect x="5" y="8" width="6" height="4" fill={level > 5 ? '#9333ea' : '#6b7280'} />
      <rect x="4" y="8" width="1" height="3" fill="#ffdbac" />
      <rect x="11" y="8" width="1" height="3" fill="#ffdbac" />
      <rect x="6" y="12" width="2" height="3" fill="#4b5563" />
      <rect x="8" y="12" width="2" height="3" fill="#4b5563" />
      {level > 3 && <rect x="12" y="7" width="1" height="4" fill="#c0c0c0" />}
      {level > 3 && <rect x="11" y="7" width="3" height="1" fill="#ffd700" />}
    </svg>
  );

  const PixelCoin = () => (
    <svg width="24" height="24" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="1" width="4" height="6" fill="#ffd700" />
      <rect x="1" y="2" width="6" height="4" fill="#ffd700" />
      <rect x="3" y="2" width="2" height="4" fill="#ffed4e" />
      <rect x="2" y="3" width="4" height="2" fill="#ffed4e" />
    </svg>
  );

  const PixelHeart = () => (
    <svg width="24" height="24" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="1" width="2" height="2" fill="#ef4444" />
      <rect x="5" y="1" width="2" height="2" fill="#ef4444" />
      <rect x="0" y="2" width="8" height="3" fill="#ef4444" />
      <rect x="1" y="5" width="6" height="1" fill="#ef4444" />
      <rect x="2" y="6" width="4" height="1" fill="#ef4444" />
      <rect x="3" y="7" width="2" height="1" fill="#ef4444" />
    </svg>
  );

  const PixelStar = () => (
    <svg width="24" height="24" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="0" width="2" height="2" fill="#3b82f6" />
      <rect x="2" y="2" width="4" height="1" fill="#3b82f6" />
      <rect x="1" y="3" width="6" height="2" fill="#3b82f6" />
      <rect x="2" y="5" width="4" height="1" fill="#3b82f6" />
      <rect x="0" y="3" width="2" height="2" fill="#3b82f6" />
      <rect x="6" y="3" width="2" height="2" fill="#3b82f6" />
      <rect x="2" y="6" width="1" height="2" fill="#3b82f6" />
      <rect x="5" y="6" width="1" height="2" fill="#3b82f6" />
    </svg>
  );

  const BossSprite = ({ type, hpPercent, isShaking }) => {
    const sprites = {
      goblin: (
        <svg width="120" height="120" viewBox="0 0 32 32" className={isShaking ? 'animate-shake' : ''} style={{ imageRendering: 'pixelated' }}>
          <rect x="11" y="7" width="10" height="9" fill="#228b22" />
          <rect x="9" y="9" width="14" height="5" fill="#228b22" />
          <rect x="12" y="10" width="2" height="2" fill="#ff0000" />
          <rect x="18" y="10" width="2" height="2" fill="#ff0000" />
          <rect x="10" y="15" width="12" height="10" fill="#2e7d32" />
          <rect x="8" y="17" width="2" height="6" fill="#2e7d32" />
          <rect x="22" y="17" width="2" height="6" fill="#2e7d32" />
          <rect x="12" y="25" width="2" height="4" fill="#1b5e20" />
          <rect x="18" y="25" width="2" height="4" fill="#1b5e20" />
        </svg>
      ),
      orc: (
        <svg width="120" height="120" viewBox="0 0 32 32" className={isShaking ? 'animate-shake' : ''} style={{ imageRendering: 'pixelated' }}>
          <rect x="10" y="6" width="12" height="10" fill="#556b2f" />
          <rect x="8" y="8" width="16" height="6" fill="#556b2f" />
          <rect x="11" y="9" width="3" height="2" fill="#8b0000" />
          <rect x="18" y="9" width="3" height="2" fill="#8b0000" />
          <rect x="9" y="16" width="14" height="9" fill="#6b8e23" />
          <rect x="7" y="18" width="2" height="6" fill="#6b8e23" />
          <rect x="23" y="18" width="2" height="6" fill="#6b8e23" />
          <rect x="11" y="25" width="3" height="4" fill="#1b5e20" />
          <rect x="18" y="25" width="3" height="4" fill="#1b5e20" />
        </svg>
      ),
      dragon: (
        <svg width="120" height="120" viewBox="0 0 32 32" className={isShaking ? 'animate-shake' : ''} style={{ imageRendering: 'pixelated' }}>
          <rect x="12" y="8" width="8" height="6" fill="#b22222" />
          <rect x="10" y="10" width="12" height="4" fill="#b22222" />
          <rect x="13" y="11" width="2" height="2" fill="#ff4500" />
          <rect x="17" y="11" width="2" height="2" fill="#ff4500" />
          <rect x="11" y="14" width="10" height="12" fill="#dc143c" />
          <rect x="9" y="16" width="2" height="8" fill="#dc143c" />
          <rect x="21" y="16" width="2" height="8" fill="#dc143c" />
          <rect x="13" y="26" width="2" height="4" fill="#8b0000" />
          <rect x="17" y="26" width="2" height="4" fill="#8b0000" />
          <rect x="8" y="12" width="4" height="4" fill="#228b22" />
          <rect x="20" y="12" width="4" height="4" fill="#228b22" />
        </svg>
      ),
      demon: (
        <svg width="120" height="120" viewBox="0 0 32 32" className={isShaking ? 'animate-shake' : ''} style={{ imageRendering: 'pixelated' }}>
          <rect x="10" y="6" width="12" height="10" fill="#4b0082" />
          <rect x="8" y="8" width="16" height="6" fill="#4b0082" />
          <rect x="11" y="9" width="3" height="2" fill="#ff0000" />
          <rect x="18" y="9" width="3" height="2" fill="#ff0000" />
          <rect x="9" y="16" width="14" height="9" fill="#800080" />
          <rect x="7" y="18" width="2" height="6" fill="#800080" />
          <rect x="23" y="18" width="2" height="6" fill="#800080" />
          <rect x="11" y="25" width="3" height="4" fill="#4b0082" />
          <rect x="18" y="25" width="3" height="4" fill="#4b0082" />
          <rect x="12" y="4" width="2" height="2" fill="#ff4500" />
          <rect x="18" y="4" width="2" height="2" fill="#ff4500" />
        </svg>
      )
    };
    return sprites[type] || sprites.goblin;
  };

  /* --------------------- DERIVED VALUES --------------------- */
  const user = currentUser ? users[currentUser] : null;
  const userParties = currentUser ? Object.values(parties).filter(p => p.members.includes(currentUser)) : [];

  /* --------------------- RENDER --------------------- */
  if (!currentUser) {
    /* ---------- LOGIN / SIGNUP PAGE ---------- */
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-white-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
          @keyframes pulse-glow { 0%,100%{opacity:.5} 50%{opacity:1} }
          @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
          .float-animation { animation: float 3s ease-in-out infinite; }
          .float-animation-delayed { animation: float 4s ease-in-out infinite 1s; }
          .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
          .glitter-bg::before,.glitter-bg::after { content:''; position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; }
          .glitter-bg::before {
            background-image:
              radial-gradient(2px 2px at 20% 30%, white, transparent),
              radial-gradient(2px 2px at 60% 70%, white, transparent),
              radial-gradient(1px 1px at 50% 50%, white, transparent);
            background-size:200% 200%; animation:sparkle 3s ease-in-out infinite;
          }
          .glitter-bg::after {
            background-image:
              radial-gradient(1px 1px at 40% 20%, #ffd700, transparent),
              radial-gradient(1px 1px at 70% 80%, #ffd700, transparent);
            background-size:250% 250%; animation:sparkle 4s ease-in-out infinite 1s;
          }
        `}</style>

        <div className="glitter-bg absolute inset-0"></div>

        <div className="absolute top-10 left-10 float-animation"><PixelCoin /></div>
        <div className="absolute top-20 right-20 float-animation-delayed"><PixelStar /></div>
        <div className="absolute bottom-20 left-20 float-animation"><PixelHeart /></div>
        <div className="absolute bottom-10 right-10 float-animation-delayed">
          <svg width="32" height="32" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
            <rect x="3" y="1" width="2" height="5" fill="#c0c0c0" />
            <rect x="2" y="1" width="4" height="1" fill="#ffd700" />
            <rect x="3" y="6" width="2" height="1" fill="#8b4513" />
          </svg>
        </div>

        <div className="absolute top-1/4 left-1/4 opacity-20">
          <svg width="60" height="60" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
            <rect x="2" y="10" width="12" height="6" fill="#8b7355" />
            <rect x="0" y="8" width="2" height="8" fill="#8b7355" />
            <rect x="14" y="8" width="2" height="8" fill="#8b7355" />
            <rect x="6" y="12" width="4" height="4" fill="#4a3728" />
          </svg>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border-4 border-yellow-500">
          <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-purple-600 rounded-tl-lg"></div>
          <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-purple-600 rounded-tr-lg"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-purple-600 rounded-bl-lg"></div>
          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-purple-600 rounded-br-lg"></div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 relative">
              <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-50 pulse-glow"></div>
              <svg width="100" height="100" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} className="relative z-10">
                <rect x="7" y="0" width="2" height="10" fill="#e0e0e0" />
                <rect x="6" y="1" width="1" height="8" fill="#a0a0a0" />
                <rect x="5" y="10" width="6" height="1" fill="#ffd700" />
                <rect x="4" y="10" width="8" height="1" fill="#ffed4e" />
                <rect x="7" y="11" width="2" height="4" fill="#8b4513" />
                <rect x="6" y="15" width="4" height="1" fill="#ffd700" />
                <rect x="7" y="2" width="2" height="1" fill="#fff" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Quest Manager
            </h1>
            <p className="text-gray-600 text-lg font-semibold">Gamify Your Life</p>
            <div className="mt-3 flex justify-center gap-3">
              <div className="flex items-center gap-1 bg-red-100 px-3 py-1 rounded-full">
                <PixelHeart /><span className="text-sm font-semibold text-red-600">HP</span>
              </div>
              <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                <PixelCoin /><span className="text-sm font-semibold text-yellow-600">Gold</span>
              </div>
              <div className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
                <PixelStar /><span className="text-sm font-semibold text-blue-600">XP</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 font-semibold">
              {error}
            </div>
          )}

          {view === 'login' ? (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">Enter Your Realm</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                  <input type="text" placeholder="Your hero name" value={loginForm.username}
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                  <input type="password" placeholder="Secret spell" value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <button onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 font-bold text-lg shadow-lg transform transition hover:scale-105">
                  Begin Quest
                </button>
                <div className="text-center">
                  <span className="text-gray-600">New adventurer? </span>
                  <button onClick={() => { setView('signup'); setError(''); }}
                    className="text-purple-600 font-bold hover:text-purple-800 underline">
                    Create Your Hero
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">Create Your Hero</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hero Name</label>
                  <input type="text" placeholder="Choose your hero name" value={signupForm.username}
                    onChange={e => setSignupForm({ ...signupForm, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Secret Spell</label>
                  <input type="password" placeholder="Create your password" value={signupForm.password}
                    onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Spell</label>
                  <input type="password" placeholder="Confirm your password" value={signupForm.confirmPassword}
                    onChange={e => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <button onClick={handleSignup}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 font-bold text-lg shadow-lg transform transition hover:scale-105">
                  Start Adventure
                </button>
                <div className="text-center">
                  <span className="text-gray-600">Already have a hero? </span>
                  <button onClick={() => { setView('login'); setError(''); }}
                    className="text-purple-600 font-bold hover:text-purple-800 underline">
                    Login Here
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t-2 border-gray-200">
            <div className="flex justify-center gap-4 text-xs text-gray-500">
              <span>Build Habits</span>
              <span>Complete Quests</span>
              <span>Level Up</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- MAIN GAME UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <style>{`
        @keyframes slide-in { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-4px)} 20%,40%,60%,80%{transform:translateX(4px)} }
        .animate-slide-in { animation: slide-in .3s ease-out; }
        .animate-shake { animation: shake .4s ease-in-out; }
      `}</style>

      {/* TOASTS */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id}
            className={`flex items-center gap-3 p-4 rounded-lg shadow-lg animate-slide-in text-white min-w-[300px] ${
              t.type==='success'?'bg-green-500':t.type==='error'?'bg-red-500':t.type==='levelup'?'bg-gradient-to-r from-yellow-400 to-orange-500':'bg-blue-500'
            }`}>
            <div className="flex-1">
              <p className="font-bold">{t.message}</p>
              {t.coins>0 && <div className="flex items-center gap-2 mt-1"><PixelCoin /><span className="text-sm">+{t.coins} coins</span></div>}
              {t.exp>0 && <div className="flex items-center gap-2 mt-1"><PixelStar /><span className="text-sm">+{t.exp} XP</span></div>}
            </div>
            <button onClick={() => removeToast(t.id)} className="text-white hover:text-gray-200"><X className="w-5 h-5" /></button>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">

        {/* USER CARD */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <PixelAvatar level={user.level} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{user.username}</h1>
                <p className="text-gray-600">Level {user.level} Adventurer</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <PixelHeart />
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-6">
                  <div className="bg-red-500 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300"
                    style={{ width: `${(user.hp / user.maxHp) * 100}%` }}>
                    {user.hp}/{user.maxHp}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PixelStar />
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-6">
                  <div className="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300"
                    style={{ width: `${user.exp}%` }}>
                    {user.exp}/100
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PixelCoin />
              <span className="text-xl font-bold text-gray-800">{user.coins}</span>
            </div>
          </div>
        </div>

        {/* NAV TABS */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setView('tasks')} className={`px-4 py-2 rounded transition-all ${view === 'tasks' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>My Tasks</button>
            <button onClick={() => setView('shop')} className={`px-4 py-2 rounded transition-all ${view === 'shop' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Shop</button>
            <button onClick={() => setView('party')} className={`px-4 py-2 rounded transition-all ${view === 'party' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Party</button>
            <button onClick={() => setView('dungeon')} className={`px-4 py-2 rounded transition-all ${view === 'dungeon' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
              <Skull className="w-5 h-5 inline mr-1" /> Dungeon
            </button>
          </div>
        </div>

        {/* ----- TASKS ----- */}
        {view === 'tasks' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">My Tasks</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Task title" value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <select value={taskForm.difficulty}
                onChange={e => setTaskForm({ ...taskForm, difficulty: e.target.value })}
                className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button onClick={addTask} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"><Plus className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2">
              {(tasks[currentUser] || []).map(task => (
                <div key={task.id}
                  className={`flex items-center justify-between p-4 rounded transition-all ${task.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => completeTask(task.id)} disabled={task.completed}
                      className={`w-6 h-6 rounded transition-all ${task.completed ? 'bg-green-500' : 'bg-white border-2 border-gray-400 hover:border-green-500'} flex items-center justify-center`}>
                      {task.completed && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <p className={task.completed ? 'line-through' : ''}>{task.title}</p>
                      <span className={`text-xs px-2 py-1 rounded ${task.difficulty === 'easy' ? 'bg-green-200' : task.difficulty === 'medium' ? 'bg-yellow-200' : 'bg-red-200'}`}>
                        {task.difficulty}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----- SHOP ----- */}
        {view === 'shop' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Shop</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shopItems.map(item => (
                <div key={item.id}
                  className="border-2 border-purple-200 rounded-lg p-4 hover:shadow-xl hover:border-purple-400 transition-all bg-gradient-to-br from-white to-purple-50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-purple-100 rounded-lg p-2 flex items-center justify-center">
                      <ShopItemIcon type={item.icon} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-purple-800">{item.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {item.effect === 'hp' ? `Restores ${item.value} HP` : 'Equipment'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-yellow-600 font-bold text-lg">
                      <PixelCoin /> {item.cost}
                    </span>
                    <button onClick={() => buyItem(item)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-md transform hover:scale-105">
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {user.inventory.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
                <h3 className="text-xl font-bold mb-3 text-purple-800">Your Inventory</h3>
                <div className="flex gap-2 flex-wrap">
                  {user.inventory.map((it, i) => (
                    <span key={i} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold shadow-md">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----- PARTY ----- */}
        {view === 'party' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Party</h2>
            <div className="flex gap-2 mb-6">
              <input type="text" placeholder="Party name" value={partyForm.name}
                onChange={e => setPartyForm({ name: e.target.value })}
                className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <button onClick={createParty}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2">
                <Users className="w-5 h-5" /> Create Party
              </button>
            </div>

            <div className="space-y-4">
              {userParties.map(party => (
                <div key={party.id} className="border rounded p-4">
                  <h3 className="text-xl font-bold mb-2">{party.name}</h3>
                  <p className="text-gray-600 mb-4">Leader: {party.leader}</p>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Party Tasks</h4>
                    <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Party task" value={partyTaskForm.title}
                        onChange={e => setPartyTaskForm({ ...partyTaskForm, title: e.target.value })}
                        className="flex-1 px-3 py-1 border rounded text-sm" />
                      <select value={partyTaskForm.difficulty}
                        onChange={e => setPartyTaskForm({ ...partyTaskForm, difficulty: e.target.value })}
                        className="px-3 py-1 border rounded text-sm">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                      <button onClick={() => addPartyTask(party.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"><Plus className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-2">
                      {party.tasks.map(task => (
                        <div key={task.id}
                          className="flex items-center justify-between p-3 bg-gray-100 rounded">
                          <div>
                            <p>{task.title}</p>
                            <span className={`text-xs px-2 py-1 rounded ${task.difficulty === 'easy' ? 'bg-green-200' : task.difficulty === 'medium' ? 'bg-yellow-200' : 'bg-red-200'}`}>
                              {task.difficulty}
                            </span>
                          </div>
                          <button onClick={() => completePartyTask(party.id, task.id)}
                            disabled={task.completedBy.includes(currentUser)}
                            className={`px-3 py-1 rounded ${task.completedBy.includes(currentUser) ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                            {task.completedBy.includes(currentUser) ? 'Completed' : 'Complete'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----- DUNGEON ----- */}
        {view === 'dungeon' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Skull className="w-6 h-6 text-red-600" /> Boss Dungeon
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(bosses).map(([key, boss]) => (
                <div key={key}
                  className="border-2 border-red-300 rounded-lg p-4 hover:border-red-500 transition-all bg-gradient-to-br from-red-50 to-red-100 cursor-pointer"
                  onClick={() => startQuest(key)}>
                  <div className="flex justify-center mb-3">
                    <BossSprite type={boss.sprite} hpPercent={100} />
                  </div>
                  <h3 className="font-bold text-center text-red-800">{boss.name}</h3>
                  <p className="text-sm text-center text-gray-600">Level {boss.level}</p>
                  <div className="flex justify-center gap-2 mt-2 text-xs">
                    <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-600" /> {boss.xpReward} XP</span>
                    <span className="flex items-center gap-1"><Coins className="w-4 h-4 text-yellow-600" /> {boss.coinReward}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----- BATTLE ----- */}
        {view === 'battle' && activeBattle && quests[activeBattle] && (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center text-red-700">BATTLE!</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Player */}
              <div className="text-center">
                <PixelAvatar level={user.level} />
                <p className="mt-2 font-semibold">{currentUser}</p>
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-6">
                    <div className="bg-red-500 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ width: `${(user.hp / user.maxHp) * 100}%` }}>
                      {user.hp}/{user.maxHp} HP
                    </div>
                  </div>
                </div>
              </div>

              {/* Boss */}
              <div className="text-center">
                <BossSprite
                  type={quests[activeBattle].boss.sprite}
                  hpPercent={(quests[activeBattle].boss.hp / quests[activeBattle].boss.maxHp) * 100}
                  isShaking={quests[activeBattle].boss.hp > 0 && quests[activeBattle].boss.hp <= quests[activeBattle].boss.maxHp * 0.3}
                />
                <p className="mt-2 font-semibold text-red-800">{quests[activeBattle].boss.name}</p>
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-6">
                    <div className="bg-red-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ width: `${(quests[activeBattle].boss.hp / quests[activeBattle].boss.maxHp) * 100}%` }}>
                      {quests[activeBattle].boss.hp}/{quests[activeBattle].boss.maxHp} HP
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Log */}
            <div className="mt-6 bg-gray-100 rounded-lg p-4 h-40 overflow-y-auto font-mono text-sm">
              {battleLog.map((l, i) => <p key={i} className="mb-1">{l}</p>)}
            </div>

            {/* Buttons */}
            <div className="mt-4 flex justify-center gap-4">
              <button onClick={attackBoss}
                disabled={quests[activeBattle].boss.hp <= 0}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-bold flex items-center gap-2">
                <Sword className="w-5 h-5" /> Attack
              </button>
              <button onClick={fleeBattle}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold flex items-center gap-2">
                <LogOut className="w-5 h-5" /> Flee
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}