// State Management
let assets = [];
let filteredAssets = [];
let currentFilter = {
    category: 'All',
    search: ''
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeEventListeners();
    loadAssets();
});

// --- AUTHENTICATION & NAVIGATION ---

function checkAuth() {
    // FIX: Added a small delay to ensure local storage state is fully loaded
    // before checking authentication status, solving the persistent local file bug.
    setTimeout(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        if (isAuthenticated === 'true') {
            showDashboard();
        } else {
            showLogin();
        }
    }, 50); // Delay of 50 milliseconds
}

function showLogin() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('dashboardPage').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');
    updateDashboard();
}

// Event Listeners
function initializeEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Add Asset Form
    document.getElementById('openAddFormBtn').addEventListener('click', showAddForm);
    document.getElementById('cancelAddBtn').addEventListener('click', hideAddForm);
    // VALIDATION INTEGRATION
    document.getElementById('addAssetForm').addEventListener('submit', handleAddAsset);

    // Edit Asset Form
    // VALIDATION INTEGRATION
    document.getElementById('editAssetForm').addEventListener('submit', handleEditAsset);
    document.getElementById('cancelEditBtn').addEventListener('click', hideEditModal);
    document.getElementById('closeModal').addEventListener('click', hideEditModal);

    // Filters
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('categoryFilter').addEventListener('change', handleCategoryFilter);

    // Export CSV
    // FIX: Element now exists in index.html
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);

    // Close modal on background click
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') {
            hideEditModal();
        }
    });
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');

    // Consolidated login logic
    if ((username === 'admin' || username === 'jm') && password === '1234') {
        localStorage.setItem('isAuthenticated', 'true');
        showToast('Login Successful', 'success');
        showDashboard();
        document.getElementById('loginForm').reset();
        errorElement.classList.remove('show');
    } else {
        errorElement.textContent = 'Invalid username or password';
        errorElement.classList.add('show');
        showToast('Invalid credentials', 'error');
    }
}

// Logout Handler
function handleLogout() {
    localStorage.removeItem('isAuthenticated');
    showToast('Logged out successfully', 'success');
    showLogin();
}

// --- ASSET MANAGEMENT: CRUD & DATA ---

function loadAssets() {
    const savedAssets = localStorage.getItem('inventoryAssets');
    if (savedAssets) {
        assets = JSON.parse(savedAssets);
    } else {
        // Initialize with sample data
        assets = [
            {
                id: '1',
                assetTag: 'SDPS-001',
                name: 'Desktop Computer',
                category: 'Electronics',
                location: 'Computer Lab',
                status: 'Available',
                dateAdded: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
            },
            {
                id: '2',
                assetTag: 'SDPS-002',
                name: 'Projector',
                category: 'Electronics',
                location: 'Room 101',
                status: 'In Use',
                dateAdded: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
            },
            {
                id: '3',
                assetTag: 'SDPS-003',
                name: 'Science Lab Table',
                category: 'Furniture',
                location: 'Lab A',
                status: 'Maintenance',
                dateAdded: new Date(Date.now() - 86400000 * 10).toISOString() // 10 days ago
            },
            // Added a sample 'Fixed' item
             {
                id: '4',
                assetTag: 'SDPS-004',
                name: 'Broken Printer',
                category: 'Electronics',
                location: 'Admin Office',
                status: 'Fixed',
                dateAdded: new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago
            }
        ];
        saveAssets();
    }
    applyFilters();
}

function saveAssets() {
    localStorage.setItem('inventoryAssets', JSON.stringify(assets));
}

// Utility for checking Asset Tag Uniqueness
function isAssetTagUnique(tag, currentAssetId = null) {
    const isDuplicate = assets.some(asset => 
        asset.assetTag.toUpperCase() === tag.toUpperCase() && asset.id !== currentAssetId
    );
    return !isDuplicate;
}

// Add Asset Handlers
function showAddForm() {
    document.getElementById('openAddFormBtn').style.display = 'none';
    document.getElementById('addAssetForm').style.display = 'flex';
}

function hideAddForm() {
    document.getElementById('openAddFormBtn').style.display = 'block';
    document.getElementById('addAssetForm').style.display = 'none';
    document.getElementById('addAssetForm').reset();
    document.getElementById('addError').classList.remove('show'); // Clear error
}

function handleAddAsset(e) {
    e.preventDefault();
    
    const assetTagInput = document.getElementById('assetTag').value.trim();
    const errorElement = document.getElementById('addError');

    // VALIDATION: Check for Asset Tag Uniqueness
    if (!isAssetTagUnique(assetTagInput)) {
        errorElement.textContent = `Asset Tag "${assetTagInput}" already exists.`;
        errorElement.classList.add('show');
        showToast('Duplicate Asset Tag prevented.', 'error');
        return;
    }
    errorElement.classList.remove('show'); // Hide error if validation passes

    const newAsset = {
        id: Date.now().toString(),
        assetTag: assetTagInput,
        name: document.getElementById('assetName').value.trim(),
        category: document.getElementById('assetCategory').value,
        location: document.getElementById('assetLocation').value.trim(),
        status: document.getElementById('assetStatus').value,
        dateAdded: new Date().toISOString() // Capture the current date
    };

    assets.push(newAsset);
    saveAssets();
    applyFilters();
    hideAddForm();
    showToast(`${newAsset.name} added successfully`, 'success');
}

// Edit Asset Handlers
function showEditModal(assetId) {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    document.getElementById('editAssetId').value = asset.id;
    document.getElementById('editAssetTag').value = asset.assetTag;
    document.getElementById('editAssetName').value = asset.name;
    document.getElementById('editAssetCategory').value = asset.category;
    document.getElementById('editAssetLocation').value = asset.location;
    document.getElementById('editAssetStatus').value = asset.status;

    document.getElementById('editModal').classList.add('active');
}

function hideEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('editAssetForm').reset();
    document.getElementById('editError').classList.remove('show'); // Clear error
}

function handleEditAsset(e) {
    e.preventDefault();
    
    const assetId = document.getElementById('editAssetId').value;
    const assetIndex = assets.findIndex(a => a.id === assetId);
    const assetTagInput = document.getElementById('editAssetTag').value.trim();
    const errorElement = document.getElementById('editError');

    if (assetIndex === -1) return;

    // VALIDATION: Check for Asset Tag Uniqueness during edit
    if (!isAssetTagUnique(assetTagInput, assetId)) {
        errorElement.textContent = `Asset Tag "${assetTagInput}" already exists.`;
        errorElement.classList.add('show');
        showToast('Duplicate Asset Tag prevented.', 'error');
        return;
    }
    errorElement.classList.remove('show'); // Hide error if validation passes

    assets[assetIndex] = {
        ...assets[assetIndex],
        assetTag: assetTagInput,
        name: document.getElementById('editAssetName').value.trim(),
        category: document.getElementById('editAssetCategory').value,
        location: document.getElementById('editAssetLocation').value.trim(),
        status: document.getElementById('editAssetStatus').value
    };

    saveAssets();
    applyFilters();
    hideEditModal();
    showToast(`${assets[assetIndex].name} updated successfully`, 'success');
}

// Delete Asset Handler
function deleteAsset(assetId, assetName) {
    if (!confirm(`Are you sure you want to delete asset: ${assetName}? This action cannot be undone.`)) {
        return;
    }

    // Filter out the asset with the matching ID
    assets = assets.filter(a => a.id !== assetId);
    
    saveAssets();
    applyFilters();
    showToast(`${assetName} deleted successfully`, 'error');
}

// --- FILTERS & DISPLAY ---

function handleSearch(e) {
    currentFilter.search = e.target.value;
    applyFilters();
}

function handleCategoryFilter(e) {
    currentFilter.category = e.target.value;
    applyFilters();
}

function applyFilters() {
    let filtered = [...assets];

    // Category filter
    if (currentFilter.category !== 'All') {
        filtered = filtered.filter(asset => asset.category === currentFilter.category);
    }

    // Search filter
    if (currentFilter.search) {
        const searchLower = currentFilter.search.toLowerCase();
        filtered = filtered.filter(asset => 
            asset.assetTag.toLowerCase().includes(searchLower) ||
            asset.name.toLowerCase().includes(searchLower)
        );
    }

    filteredAssets = filtered;
    updateDashboard();
}

// Update Dashboard
function updateDashboard() {
    updateMetrics();
    updateCategoryFilter();
    renderAssetTable(); 
}

function updateMetrics() {
    const totalAssets = assets.length;
    const availableAssets = assets.filter(a => a.status === 'Available').length;
    // UPDATED: In Use metric now includes the new 'Fixed' status
    const inUseAssets = assets.filter(a => 
        a.status === 'In Use' || a.status === 'Fixed'
    ).length;
    // UPDATED: Maintenance metric remains for items needing attention
    const maintenanceAssets = assets.filter(a => 
        a.status === 'Maintenance' || a.status === 'Repair'
    ).length;

    document.getElementById('totalAssets').textContent = totalAssets;
    document.getElementById('availableAssets').textContent = availableAssets;
    document.getElementById('inUseAssets').textContent = inUseAssets;
    document.getElementById('maintenanceAssets').textContent = maintenanceAssets;
}

function updateCategoryFilter() {
    const categories = ['All', ...new Set(assets.map(a => a.category))];
    const filterSelect = document.getElementById('categoryFilter');
    const currentValue = filterSelect.value;

    filterSelect.innerHTML = categories
        .map(category => `<option value="${category}">${category}</option>`)
        .join('');

    if (categories.includes(currentValue)) {
        filterSelect.value = currentValue;
    }
}

// NEW: Function to format the date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// NEW: Combined function to render both Table (Desktop) and Cards (Mobile)
function renderAssetTable() {
    const tbody = document.getElementById('assetTableBody');
    const cardList = document.getElementById('assetCardList');

    if (filteredAssets.length === 0) {
        // Handle empty state for both views
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="6">No assets found matching the filter.</td>
            </tr>
        `;
        cardList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 48px 20px; color: var(--color-text-muted); font-style: italic;">
                No assets found matching the filter.
            </div>
        `;
        return;
    }

    // 1. Render Table (Desktop View)
    tbody.innerHTML = filteredAssets.map(asset => `
        <tr>
            <td><strong>${asset.assetTag}</strong></td>
            <td>${asset.name}</td>
            <td>${asset.category}</td>
            <td>${asset.location}</td>
            <td>
                <span class="badge ${getStatusClass(asset.status)}">
                    ${asset.status}
                </span>
            </td>
            <td class="text-right">
                <button class="btn btn-icon" onclick="showEditModal('${asset.id}')" title="Edit Asset">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn btn-icon text-destructive" onclick="deleteAsset('${asset.id}', '${asset.name}')" title="Delete Asset">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    // 2. Render Cards (Mobile View)
    cardList.innerHTML = filteredAssets.map(asset => `
        <div class="asset-card">
            <div class="card-title">
                ${asset.assetTag} - ${asset.name}
            </div>
            <div class="card-row">
                <span class="card-label">Category</span>
                <span class="card-value">${asset.category}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Location</span>
                <span class="card-value">${asset.location}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Status</span>
                <span class="card-value">
                    <span class="badge ${getStatusClass(asset.status)}">
                        ${asset.status}
                    </span>
                </span>
            </div>
            <div class="card-row">
                <span class="card-label">Date Added</span>
                <span class="card-value">${formatDate(asset.dateAdded)}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-icon" onclick="showEditModal('${asset.id}')" title="Edit Asset">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn btn-icon text-destructive" onclick="deleteAsset('${asset.id}', '${asset.name}')" title="Delete Asset">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// --- UTILITIES ---

// Export Data Capability
function exportToCsv() {
    if (assets.length === 0) {
        showToast('No assets to export.', 'warning');
        return;
    }

    // 1. Define CSV Header (Column Titles)
    const headers = ["Asset Tag", "Name", "Category", "Location", "Status", "Date Added"];
    let csv = headers.join(',') + '\n';

    // 2. Map Assets to CSV rows
    assets.forEach(asset => {
        // Ensure values are wrapped in quotes and commas are handled
        const safeValue = (val) => `"${String(val).replace(/"/g, '""').trim()}"`;
        
        const row = [
            safeValue(asset.assetTag),
            safeValue(asset.name),
            safeValue(asset.category),
            safeValue(asset.location),
            safeValue(asset.status),
            safeValue(new Date(asset.dateAdded).toLocaleDateString()) 
        ].join(',');
        csv += row + '\n';
    });

    // 3. Trigger Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'sdps_inventory_export_' + Date.now() + '.csv');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Inventory exported successfully!', 'success');
}

function getStatusClass(status) {
    const statusMap = {
        'Available': 'badge-available',
        'In Use': 'badge-in-use',
        'Maintenance': 'badge-maintenance',
        'Repair': 'badge-repair',
        'Fixed': 'badge-fixed' // NEW STATUS MAPPING
    };
    return statusMap[status] || 'badge-available';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
