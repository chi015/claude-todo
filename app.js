'use strict';

const STORAGE_KEY = 'claude-todos';

// ── State ──────────────────────────────────────────────
let todos = [];
let currentFilter = 'all';

// ── DOM ────────────────────────────────────────────────
const input      = document.getElementById('todoInput');
const addBtn     = document.getElementById('addBtn');
const list       = document.getElementById('todoList');
const summary    = document.getElementById('summary');
const clearBtn   = document.getElementById('clearBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// ── LocalStorage ───────────────────────────────────────
function load() {
  try {
    todos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    todos = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// ── CRUD ───────────────────────────────────────────────
function addTodo(text) {
  text = text.trim();
  if (!text) return;

  todos.unshift({ id: Date.now(), text, completed: false });
  save();
  render();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  save();
  render();
}

function toggleTodo(id) {
  todos = todos.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  save();
  render();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  save();
  render();
}

// ── Render ─────────────────────────────────────────────
function getFiltered() {
  if (currentFilter === 'active')    return todos.filter(t => !t.completed);
  if (currentFilter === 'completed') return todos.filter(t =>  t.completed);
  return todos;
}

function render() {
  const filtered    = getFiltered();
  const total       = todos.length;
  const doneCount   = todos.filter(t => t.completed).length;
  const activeCount = total - doneCount;

  // サマリー更新
  summary.textContent = total === 0
    ? ''
    : `全 ${total} 件 ／ 未完了 ${activeCount} 件 ／ 完了 ${doneCount} 件`;

  // 完了済み削除ボタンの有効・無効
  clearBtn.disabled = doneCount === 0;

  // 空状態
  if (filtered.length === 0) {
    const messages = {
      all:       'タスクを追加してみましょう！',
      active:    '未完了のタスクはありません',
      completed: '完了済みのタスクはありません',
    };
    list.innerHTML = `
      <li class="empty">
        <span>✨</span>
        ${messages[currentFilter]}
      </li>`;
    return;
  }

  // TODOアイテムを描画
  list.innerHTML = filtered.map(todo => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
      <div class="todo-check" data-action="toggle"></div>
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <button class="btn-delete" data-action="delete" title="削除">✕</button>
    </li>
  `).join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Events ─────────────────────────────────────────────
addBtn.addEventListener('click', () => {
  addTodo(input.value);
  input.value = '';
  input.focus();
});

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addTodo(input.value);
    input.value = '';
  }
});

// TODOリストのトグル・削除（イベント委譲）
list.addEventListener('click', e => {
  const item = e.target.closest('[data-id]');
  if (!item) return;

  const id     = Number(item.dataset.id);
  const action = e.target.dataset.action;

  if (action === 'toggle') toggleTodo(id);
  if (action === 'delete') deleteTodo(id);
});

// フィルター切り替え
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

// 完了済み一括削除
clearBtn.addEventListener('click', () => {
  if (confirm('完了済みのタスクをすべて削除しますか？')) {
    clearCompleted();
  }
});

// ── 初期化 ─────────────────────────────────────────────
load();
render();
input.focus();
