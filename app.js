// PocketBank - Application Logic

class PocketBank {
  constructor() {
    this.currentMonth = new Date();
    this.currentView = 'overview';
    this.editingItem = null;
    this.data = this.loadData();
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupEventListeners();
    this.updateAllViews();
  }

  // Service Worker Registration
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('Service Worker registered'))
        .catch(err => console.error('Service Worker registration failed:', err));
    }
  }

  // Data Management
  loadData() {
    const stored = localStorage.getItem('pocketbank-data');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      budgets: {}, // Keyed by 'YYYY-MM'
      savings: [],
      recurringExpenses: [] // Fixed expenses that repeat every month
    };
  }

  saveData() {
    localStorage.setItem('pocketbank-data', JSON.stringify(this.data));
  }

  getMonthKey(date = this.currentMonth) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  getMonthData(monthKey = this.getMonthKey()) {
    if (!this.data.budgets[monthKey]) {
      this.data.budgets[monthKey] = {
        income: [],
        expenses: []
      };
      // Auto-populate recurring expenses for new months
      this.populateRecurringExpenses(monthKey);
    }
    return this.data.budgets[monthKey];
  }

  populateRecurringExpenses(monthKey) {
    if (!this.data.recurringExpenses) {
      this.data.recurringExpenses = [];
    }

    const monthData = this.data.budgets[monthKey];
    this.data.recurringExpenses.forEach(recurring => {
      // Check if this recurring expense is already in the month
      const exists = monthData.expenses.some(exp =>
        exp.recurringId === recurring.id
      );

      if (!exists) {
        monthData.expenses.push({
          id: Date.now() + Math.random(),
          category: recurring.category,
          description: recurring.description,
          amount: recurring.amount,
          recurringId: recurring.id,
          isRecurring: true
        });
      }
    });
  }

  // Month Navigation
  formatMonth(date) {
    const months = [
      'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  previousMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.updateAllViews();
  }

  nextMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.updateAllViews();
  }

  // View Management
  switchView(viewName) {
    this.currentView = viewName;

    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.view === viewName) {
        tab.classList.add('active');
      }
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(`view-${viewName}`).classList.add('active');

    this.updateAllViews();
  }

  // Budget Calculations
  calculateTotals(monthKey = this.getMonthKey()) {
    const monthData = this.getMonthData(monthKey);

    const totalIncome = monthData.income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalExpenses = monthData.expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const disposable = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, disposable };
  }

  formatCurrency(amount) {
    return `${Math.round(amount).toLocaleString('da-DK')} kr`;
  }

  // Income Management
  addIncome(description, amount) {
    const today = new Date();
    const monthKey = this.getMonthKey(today);
    const monthData = this.getMonthData(monthKey);

    monthData.income.push({
      id: Date.now(),
      description,
      amount: parseFloat(amount)
    });

    this.saveData();
    this.updateAllViews();
  }

  editIncome(id, description, amount) {
    const today = new Date();
    const monthKey = this.getMonthKey(today);
    const monthData = this.getMonthData(monthKey);

    const item = monthData.income.find(i => i.id === id);
    if (item) {
      item.description = description;
      item.amount = parseFloat(amount);
      this.saveData();
      this.updateAllViews();
    }
  }

  deleteIncome(id) {
    const today = new Date();
    const monthKey = this.getMonthKey(today);
    const monthData = this.getMonthData(monthKey);

    monthData.income = monthData.income.filter(i => i.id !== id);
    this.saveData();
    this.updateAllViews();
  }

  // Expense Management
  addExpense(category, description, amount, isRecurring = false) {
    if (isRecurring) {
      // Add to recurring expenses
      const recurring = {
        id: Date.now(),
        category,
        description,
        amount: parseFloat(amount)
      };
      this.data.recurringExpenses.push(recurring);

      // Add to all existing months
      Object.keys(this.data.budgets).forEach(monthKey => {
        const monthData = this.data.budgets[monthKey];
        monthData.expenses.push({
          id: Date.now() + Math.random(),
          category,
          description,
          amount: parseFloat(amount),
          recurringId: recurring.id,
          isRecurring: true
        });
      });
    } else {
      // Regular one-time expense
      const today = new Date();
      const monthKey = this.getMonthKey(today);
      const monthData = this.getMonthData(monthKey);

      monthData.expenses.push({
        id: Date.now(),
        category,
        description,
        amount: parseFloat(amount),
        isRecurring: false
      });
    }

    this.saveData();
    this.updateAllViews();
  }

  editExpense(id, category, description, amount, isRecurring = false) {
    const today = new Date();
    const monthKey = this.getMonthKey(today);
    const monthData = this.getMonthData(monthKey);

    const item = monthData.expenses.find(e => e.id === id);
    if (item) {
      // If it's a recurring expense being edited
      if (item.isRecurring && item.recurringId) {
        // Update the recurring template
        const recurring = this.data.recurringExpenses.find(r => r.id === item.recurringId);
        if (recurring) {
          recurring.category = category;
          recurring.description = description;
          recurring.amount = parseFloat(amount);

          // Update all instances across all months
          Object.keys(this.data.budgets).forEach(mk => {
            const md = this.data.budgets[mk];
            md.expenses.forEach(exp => {
              if (exp.recurringId === item.recurringId) {
                exp.category = category;
                exp.description = description;
                exp.amount = parseFloat(amount);
              }
            });
          });
        }
      } else {
        // Regular expense edit
        item.category = category;
        item.description = description;
        item.amount = parseFloat(amount);
      }

      this.saveData();
      this.updateAllViews();
    }
  }

  deleteExpense(id) {
    const today = new Date();
    const monthKey = this.getMonthKey(today);
    const monthData = this.getMonthData(monthKey);

    const expense = monthData.expenses.find(e => e.id === id);

    // If it's a recurring expense, remove from all months and recurring list
    if (expense && expense.isRecurring && expense.recurringId) {
      // Remove from recurring expenses
      this.data.recurringExpenses = this.data.recurringExpenses.filter(
        r => r.id !== expense.recurringId
      );

      // Remove from all months
      Object.keys(this.data.budgets).forEach(mk => {
        const md = this.data.budgets[mk];
        md.expenses = md.expenses.filter(e => e.recurringId !== expense.recurringId);
      });
    } else {
      // Regular expense, just remove from current month
      monthData.expenses = monthData.expenses.filter(e => e.id !== id);
    }

    this.saveData();
    this.updateAllViews();
  }

  // Savings Management
  addSavings(name, target, current, startDate, endDate) {
    const monthly = this.calculateMonthlyAmount(target, current, startDate, endDate);

    this.data.savings.push({
      id: Date.now(),
      name,
      target: parseFloat(target),
      current: parseFloat(current),
      startDate,
      endDate,
      monthly
    });

    this.saveData();
    this.updateAllViews();
  }

  editSavings(id, name, target, current, startDate, endDate) {
    const item = this.data.savings.find(s => s.id === id);
    if (item) {
      item.name = name;
      item.target = parseFloat(target);
      item.current = parseFloat(current);
      item.startDate = startDate;
      item.endDate = endDate;
      item.monthly = this.calculateMonthlyAmount(target, current, startDate, endDate);
      this.saveData();
      this.updateAllViews();
    }
  }

  calculateMonthlyAmount(target, current, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate months between dates
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 +
                       (end.getMonth() - start.getMonth()) + 1;

    const remaining = parseFloat(target) - parseFloat(current);

    if (monthsDiff <= 0 || remaining <= 0) return 0;

    return remaining / monthsDiff;
  }

  deleteSavings(id) {
    this.data.savings = this.data.savings.filter(s => s.id !== id);
    this.saveData();
    this.updateAllViews();
  }

  calculateSavingsProgress(savings) {
    const progress = (savings.current / savings.target) * 100;
    const remaining = savings.target - savings.current;
    const monthsRemaining = remaining > 0 ? Math.ceil(remaining / savings.monthly) : 0;

    return {
      progress: Math.min(progress, 100),
      remaining,
      monthsRemaining
    };
  }

  // UI Updates
  updateAllViews() {
    this.updateOverview();
    this.updateBudget();
    this.updateSavings();
  }

  updateOverview() {
    // Always show current month in overview
    const today = new Date();
    const currentMonthKey = this.getMonthKey(today);
    const { totalIncome, totalExpenses, disposable } = this.calculateTotals(currentMonthKey);

    // Update month display
    document.getElementById('current-month').textContent = this.formatMonth(today);

    // Update balance card
    document.getElementById('disposable-amount').textContent = this.formatCurrency(disposable);
    document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = this.formatCurrency(totalExpenses);

    // Update savings overview
    const savingsListOverview = document.getElementById('savings-list-overview');
    if (this.data.savings.length === 0) {
      savingsListOverview.innerHTML = '<div class="savings-empty">Ingen opsparingsmål endnu</div>';
    } else {
      savingsListOverview.innerHTML = this.data.savings.map(savings => {
        const { progress, monthsRemaining } = this.calculateSavingsProgress(savings);
        return `
          <div class="savings-item">
            <div class="savings-header">
              <span class="savings-name">${savings.name}</span>
            </div>
            <div class="savings-progress-bar">
              <div class="savings-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="savings-details">
              <div class="savings-detail-row">
                <span>Opsparet</span>
                <span>${this.formatCurrency(savings.current)} af ${this.formatCurrency(savings.target)}</span>
              </div>
              <div class="savings-detail-row">
                <span>Månedligt beløb</span>
                <span>${this.formatCurrency(savings.monthly)}</span>
              </div>
              ${monthsRemaining > 0 ? `
                <div class="savings-detail-row">
                  <span>Måneder tilbage</span>
                  <span>${monthsRemaining}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  updateBudget() {
    // Always show current month in budget
    const today = new Date();
    const currentMonthKey = this.getMonthKey(today);
    const monthData = this.getMonthData(currentMonthKey);
    const { totalIncome, totalExpenses, disposable } = this.calculateTotals(currentMonthKey);

    // Update month display
    document.getElementById('budget-current-month').textContent = this.formatMonth(today);

    // Update income list
    const incomeList = document.getElementById('income-list');
    if (monthData.income.length === 0) {
      incomeList.innerHTML = '<div class="empty-state">Ingen indtægter tilføjet endnu</div>';
    } else {
      incomeList.innerHTML = monthData.income.map(item => `
        <div class="transaction-item">
          <div class="transaction-info">
            <div class="transaction-description">${item.description}</div>
          </div>
          <span class="transaction-amount">${this.formatCurrency(item.amount)}</span>
          <div class="transaction-actions">
            <button class="btn-delete" onclick="app.openIncomeModal(${item.id})">Rediger</button>
            <button class="btn-delete" onclick="app.deleteIncome(${item.id})">Slet</button>
          </div>
        </div>
      `).join('');
    }

    // Update expense list
    const expenseList = document.getElementById('expense-list');
    if (monthData.expenses.length === 0) {
      expenseList.innerHTML = '<div class="empty-state">Ingen udgifter tilføjet endnu</div>';
    } else {
      expenseList.innerHTML = monthData.expenses.map(item => `
        <div class="transaction-item">
          <div class="transaction-info">
            <div class="transaction-category">${item.category}${item.isRecurring ? ' • Fast' : ''}</div>
            <div class="transaction-description">${item.description}</div>
          </div>
          <span class="transaction-amount">${this.formatCurrency(item.amount)}</span>
          <div class="transaction-actions">
            <button class="btn-delete" onclick="app.openExpenseModal(${item.id})">Rediger</button>
            <button class="btn-delete" onclick="app.deleteExpense(${item.id})">Slet</button>
          </div>
        </div>
      `).join('');
    }

    // Update summary
    document.getElementById('budget-total-income').textContent = this.formatCurrency(totalIncome);
    document.getElementById('budget-total-expenses').textContent = this.formatCurrency(totalExpenses);
    document.getElementById('budget-disposable').textContent = this.formatCurrency(disposable);
  }

  updateSavings() {
    const savingsList = document.getElementById('savings-list');

    if (this.data.savings.length === 0) {
      savingsList.innerHTML = '<div class="savings-empty">Ingen opsparingsmål endnu</div>';
    } else {
      savingsList.innerHTML = this.data.savings.map(savings => {
        const { progress, remaining, monthsRemaining } = this.calculateSavingsProgress(savings);
        return `
          <div class="savings-item">
            <div class="savings-header">
              <span class="savings-name">${savings.name}</span>
              <div>
                <button class="btn-delete" onclick="app.openSavingsModal(${savings.id})">Rediger</button>
                <button class="btn-delete" onclick="app.deleteSavings(${savings.id})">Slet</button>
              </div>
            </div>
            <div class="savings-progress-bar">
              <div class="savings-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="savings-details">
              <div class="savings-detail-row">
                <span>Mål</span>
                <span>${this.formatCurrency(savings.target)}</span>
              </div>
              <div class="savings-detail-row">
                <span>Opsparet</span>
                <span>${this.formatCurrency(savings.current)}</span>
              </div>
              ${remaining > 0 ? `
                <div class="savings-detail-row">
                  <span>Mangler</span>
                  <span>${this.formatCurrency(remaining)}</span>
                </div>
              ` : ''}
              <div class="savings-detail-row">
                <span>Månedligt beløb</span>
                <span>${this.formatCurrency(savings.monthly)}</span>
              </div>
              ${monthsRemaining > 0 ? `
                <div class="savings-detail-row">
                  <span>Måneder tilbage</span>
                  <span>${monthsRemaining}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Modal Management
  openIncomeModal(id = null) {
    const modal = document.getElementById('income-modal');
    const form = document.getElementById('income-form');

    if (id) {
      const today = new Date();
      const monthData = this.getMonthData(this.getMonthKey(today));
      const item = monthData.income.find(i => i.id === id);
      if (item) {
        document.getElementById('income-id').value = item.id;
        document.getElementById('income-description').value = item.description;
        document.getElementById('income-amount').value = item.amount;
      }
    } else {
      form.reset();
      document.getElementById('income-id').value = '';
    }

    modal.classList.add('active');
  }

  closeIncomeModal() {
    document.getElementById('income-modal').classList.remove('active');
  }

  openExpenseModal(id = null) {
    const modal = document.getElementById('expense-modal');
    const form = document.getElementById('expense-form');

    if (id) {
      const today = new Date();
      const monthData = this.getMonthData(this.getMonthKey(today));
      const item = monthData.expenses.find(e => e.id === id);
      if (item) {
        document.getElementById('expense-id').value = item.id;
        document.getElementById('expense-category').value = item.category;
        document.getElementById('expense-description').value = item.description;
        document.getElementById('expense-amount').value = item.amount;
        document.getElementById('expense-recurring').checked = item.isRecurring || false;
      }
    } else {
      form.reset();
      document.getElementById('expense-id').value = '';
      document.getElementById('expense-recurring').checked = false;
    }

    modal.classList.add('active');
  }

  closeExpenseModal() {
    document.getElementById('expense-modal').classList.remove('active');
  }

  openSavingsModal(id = null) {
    const modal = document.getElementById('savings-modal');
    const form = document.getElementById('savings-form');

    if (id) {
      const item = this.data.savings.find(s => s.id === id);
      if (item) {
        document.getElementById('savings-id').value = item.id;
        document.getElementById('savings-name').value = item.name;
        document.getElementById('savings-target').value = item.target;
        document.getElementById('savings-current').value = item.current;
        document.getElementById('savings-start-date').value = item.startDate || '';
        document.getElementById('savings-end-date').value = item.endDate || '';

        // Show calculated monthly amount
        if (item.startDate && item.endDate) {
          document.getElementById('monthly-amount-display').textContent = this.formatCurrency(item.monthly);
          document.getElementById('calculated-monthly').style.display = 'block';
        }
      }
    } else {
      form.reset();
      document.getElementById('savings-id').value = '';
      document.getElementById('calculated-monthly').style.display = 'none';
    }

    modal.classList.add('active');
  }

  closeSavingsModal() {
    document.getElementById('savings-modal').classList.remove('active');
  }

  // Event Listeners
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchView(tab.dataset.view);
      });
    });

    // Add buttons
    document.getElementById('add-income-btn').addEventListener('click', () => this.openIncomeModal());
    document.getElementById('add-expense-btn').addEventListener('click', () => this.openExpenseModal());
    document.getElementById('add-savings-btn').addEventListener('click', () => this.openSavingsModal());

    // Income form
    document.getElementById('income-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('income-id').value;
      const description = document.getElementById('income-description').value;
      const amount = document.getElementById('income-amount').value;

      if (id) {
        this.editIncome(parseInt(id), description, amount);
      } else {
        this.addIncome(description, amount);
      }
      this.closeIncomeModal();
    });

    document.getElementById('cancel-income').addEventListener('click', () => this.closeIncomeModal());

    // Expense form
    document.getElementById('expense-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('expense-id').value;
      const category = document.getElementById('expense-category').value;
      const description = document.getElementById('expense-description').value;
      const amount = document.getElementById('expense-amount').value;
      const isRecurring = document.getElementById('expense-recurring').checked;

      if (id) {
        this.editExpense(parseInt(id), category, description, amount, isRecurring);
      } else {
        this.addExpense(category, description, amount, isRecurring);
      }
      this.closeExpenseModal();
    });

    document.getElementById('cancel-expense').addEventListener('click', () => this.closeExpenseModal());

    // Savings form
    document.getElementById('savings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('savings-id').value;
      const name = document.getElementById('savings-name').value;
      const target = document.getElementById('savings-target').value;
      const current = document.getElementById('savings-current').value || 0;
      const startDate = document.getElementById('savings-start-date').value;
      const endDate = document.getElementById('savings-end-date').value;

      if (id) {
        this.editSavings(parseInt(id), name, target, current, startDate, endDate);
      } else {
        this.addSavings(name, target, current, startDate, endDate);
      }
      this.closeSavingsModal();
    });

    // Update calculated monthly amount when dates change
    const updateMonthlyDisplay = () => {
      const target = parseFloat(document.getElementById('savings-target').value) || 0;
      const current = parseFloat(document.getElementById('savings-current').value) || 0;
      const startDate = document.getElementById('savings-start-date').value;
      const endDate = document.getElementById('savings-end-date').value;

      if (startDate && endDate && target > 0) {
        const monthly = this.calculateMonthlyAmount(target, current, startDate, endDate);
        document.getElementById('monthly-amount-display').textContent = this.formatCurrency(monthly);
        document.getElementById('calculated-monthly').style.display = 'block';
      } else {
        document.getElementById('calculated-monthly').style.display = 'none';
      }
    };

    document.getElementById('savings-target').addEventListener('input', updateMonthlyDisplay);
    document.getElementById('savings-current').addEventListener('input', updateMonthlyDisplay);
    document.getElementById('savings-start-date').addEventListener('change', updateMonthlyDisplay);
    document.getElementById('savings-end-date').addEventListener('change', updateMonthlyDisplay);

    document.getElementById('cancel-savings').addEventListener('click', () => this.closeSavingsModal());

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  }
}

// Initialize app
const app = new PocketBank();
