document.addEventListener('DOMContentLoaded', () => {

    let assets = JSON.parse(localStorage.getItem('assets')) || [];
    let assetIdCounter = JSON.parse(localStorage.getItem('assetIdCounter')) || 1;
    
    // list of locations (offices/labs)
    const LOCATIONS = [
        "Computer Lab",
        "Science Lab",
        "Faculty Office",
        "Library",
        "Admin Office",
        "Room 101 (Classroom)",
        "Room 102 (Classroom)",
        "Room 201 (Classroom)"
    ];
    let currentLocation = 'All'; // Default view is Master View


    const loginPage = document.getElementById('loginPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    const assetTableBody = document.getElementById('assetTableBody');
    const assetCardList = document.getElementById('assetCardList');
    const locationFilter = document.getElementById('locationFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    
    // Add/Edit Form Elements
    const openAddFormBtn = document.getElementById('openAddFormBtn');
    const addAssetForm = document.getElementById('addAssetForm');
    const cancelAddBtn = document.getElementById('cancelAddBtn');
    const assetLocationInput = document.getElementById('assetLocation');
    const addError = document.getElementById('addError');
    
    
    const locationWarning = document.getElementById('locationWarning'); 

    const editModal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editAssetForm = document.getElementById('editAssetForm');
    const editError = document.getElementById('editError');
    const editAssetLocation = document.getElementById('editAssetLocation');

    const currentLocationTitle = document.getElementById('currentLocationTitle');

    // --- UTILITIES ---

    const saveData = () => {
        localStorage.setItem('assets', JSON.stringify(assets));
        localStorage.setItem('assetIdCounter', JSON.stringify(assetIdCounter));
    };

    const showToast = (message, type = 'success') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // --- VIEW / RENDERING FUNCTIONS ---

    const getFilteredAssets = () => {
        let filteredAssets = assets;
        
        // 1. Filter by Location
        if (currentLocation !== 'All') {
            filteredAssets = filteredAssets.filter(asset => asset.location === currentLocation);
        }

        // 2. Filter by Category
        const selectedCategory = categoryFilter.value;
        if (selectedCategory !== 'All') {
            filteredAssets = filteredAssets.filter(asset => asset.category === selectedCategory);
        }

        // 3. Filter by Search Tag
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredAssets = filteredAssets.filter(asset => asset.tag.toLowerCase().includes(searchTerm));
        }

        return filteredAssets;
    };
    
    const populateLocationFilter = () => {
        locationFilter.innerHTML = '<option value="All">All Locations (Master View)</option>';
        
        LOCATIONS.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
        
        locationFilter.value = currentLocation;
    };
    
    const updateCategoryFilter = () => {
        // Assets used for category filtering should only be those currently visible
        const assetsInView = getFilteredAssets(); 
        const categories = [...new Set(assetsInView.map(asset => asset.category))].sort();
        
        const currentSelected = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="All">All Categories</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        if (categories.includes(currentSelected)) {
            categoryFilter.value = currentSelected;
        } else {
            categoryFilter.value = 'All';
        }
    };

    const createBadge = (status) => {
        const span = document.createElement('span');
        span.textContent = status;
        span.classList.add('badge', `badge-${status.toLowerCase().replace(/\s/g, '-')}`);
        return span;
    };

    const renderTable = () => {
        const filteredAssets = getFilteredAssets();
        assetTableBody.innerHTML = '';
        assetCardList.innerHTML = '';

        if (filteredAssets.length === 0) {
            const emptyStateRow = document.createElement('tr');
            emptyStateRow.classList.add('empty-state');
            emptyStateRow.innerHTML = `<td colspan="6">No assets found in ${currentLocation === 'All' ? 'any location with these filters.' : currentLocation}.</td>`;
            assetTableBody.appendChild(emptyStateRow);
            assetCardList.style.display = 'none'; 
            
        } else {
             filteredAssets.forEach(asset => {
                // ... (Table Row and Mobile Card generation code is unchanged)
                
                const row = assetTableBody.insertRow();
                row.dataset.id = asset.id;
                
                row.insertCell().textContent = asset.tag;
                row.insertCell().textContent = asset.name;
                row.insertCell().textContent = asset.category;
                row.insertCell().textContent = asset.location;
                row.insertCell().appendChild(createBadge(asset.status));

                const actionsCell = row.insertCell();
                actionsCell.classList.add('text-right');
                actionsCell.innerHTML = `
                    <button class="btn btn-icon edit-btn" data-id="${asset.id}" title="Edit">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-icon delete-btn text-destructive" data-id="${asset.id}" title="Delete">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                `;

                const card = document.createElement('div');
                card.classList.add('asset-card');
                card.dataset.id = asset.id;
                
                card.innerHTML = `
                    <div class="card-title">${asset.tag} - ${asset.name}</div>
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
                        <span class="card-value">${createBadge(asset.status).outerHTML}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-icon edit-btn" data-id="${asset.id}" title="Edit">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                        <button class="btn btn-icon delete-btn text-destructive" data-id="${asset.id}" title="Delete">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `;
                assetCardList.appendChild(card);
             });
        }


        // Ensure the card list is visible on mobile if assets exist
        if (window.innerWidth <= 768 && filteredAssets.length > 0) {
             assetCardList.style.display = 'flex';
        }

        attachEditDeleteListeners();
        updateMetrics();
        updateCategoryFilter();
    };

    const updateMetrics = () => {
        // CRITICAL: Ensure currentLocation matches the filter value
        currentLocation = locationFilter.value; 
        
        // Calculate metrics only for the currently filtered assets (by Location)
        const assetsInView = assets.filter(asset => currentLocation === 'All' || asset.location === currentLocation);

        const total = assetsInView.length;
        const available = assetsInView.filter(a => a.status === 'Available').length;
        const inUseFixed = assetsInView.filter(a => a.status === 'In Use' || a.status === 'Fixed').length;
        const maintenance = assetsInView.filter(a => a.status === 'Maintenance' || a.status === 'Repair').length;

        document.getElementById('totalAssets').textContent = total;
        document.getElementById('availableAssets').textContent = available;
        document.getElementById('inUseAssets').textContent = inUseFixed;
        document.getElementById('maintenanceAssets').textContent = maintenance;
        
        // Update the main title to show the current view
        currentLocationTitle.textContent = `Viewing: ${currentLocation === 'All' ? 'All Locations (Master View)' : currentLocation}`;
        
        // --- CRITICAL VISIBILITY LOGIC FIX ---
        if (currentLocation === 'All') {
            // Master View: Disable Add functionality
            locationWarning.style.display = 'block'; 
            openAddFormBtn.style.display = 'none';
            addAssetForm.style.display = 'none'; // Ensure form is hidden
        } else {
            // Specific Location: Enable Add functionality
            locationWarning.style.display = 'none'; 
            openAddFormBtn.style.display = 'block'; 
            
            // Also ensure the form is hidden (only the button shows initially) and location is set
            addAssetForm.style.display = 'none'; 
            assetLocationInput.value = currentLocation;
        }
        // -------------------------------------
        
    };


    // --- CRUD FUNCTIONS ---

    const handleAddAsset = (e) => {
        e.preventDefault();
        
        if (currentLocation === 'All') {
            addError.textContent = "Please select a specific Office/Laboratory before adding an asset.";
            addError.style.display = 'block';
            return;
        }

        const newAsset = {
            id: assetIdCounter++,
            tag: document.getElementById('assetTag').value.trim(),
            name: document.getElementById('assetName').value.trim(),
            category: document.getElementById('assetCategory').value.trim(),
            location: currentLocation, 
            status: document.getElementById('assetStatus').value,
            dateAdded: new Date().toISOString().split('T')[0] 
        };

        if (!newAsset.tag || !newAsset.name || !newAsset.category || !newAsset.location) {
            addError.textContent = "All fields are required.";
            addError.style.display = 'block';
            return;
        }

        if (assets.some(a => a.tag === newAsset.tag)) {
             addError.textContent = `Asset Tag "${newAsset.tag}" already exists.`;
             addError.style.display = 'block';
             return;
        }
        
        addError.style.display = 'none';

        assets.push(newAsset);
        saveData();
        renderTable(); 
        
        // Reset form and UI
        addAssetForm.reset();
        addAssetForm.style.display = 'none';
        openAddFormBtn.style.display = 'block';
        showToast('Asset added successfully.');
    };

    const handleEditAsset = (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('editAssetId').value);
        const index = assets.findIndex(asset => asset.id === id);

        if (index > -1) {
            const updatedAsset = {
                ...assets[index], 
                tag: document.getElementById('editAssetTag').value.trim(),
                name: document.getElementById('editAssetName').value.trim(),
                category: document.getElementById('editAssetCategory').value.trim(),
                location: document.getElementById('editAssetLocation').value.trim(),
                status: document.getElementById('editAssetStatus').value
            };
            
            if (!updatedAsset.tag || !updatedAsset.name || !updatedAsset.category || !updatedAsset.location) {
                editError.textContent = "All fields are required.";
                editError.style.display = 'block';
                return;
            }
            
            if (assets.some(a => a.tag === updatedAsset.tag && a.id !== id)) {
                editError.textContent = `Asset Tag "${updatedAsset.tag}" already exists.`;
                editError.style.display = 'block';
                return;
            }

            editError.style.display = 'none';
            assets[index] = updatedAsset;
            saveData();
            renderTable();
            editModal.classList.remove('active');
            showToast('Asset updated successfully.');
        }
    };

    const handleDeleteAsset = (id) => {
        if (confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
            assets = assets.filter(asset => asset.id !== id);
            saveData();
            renderTable();
            showToast('Asset deleted successfully.', 'destructive');
        }
    };

    const populateEditModal = (id) => {
        const asset = assets.find(a => a.id === id);
        if (asset) {
            document.getElementById('editAssetId').value = asset.id;
            document.getElementById('editAssetTag').value = asset.tag;
            document.getElementById('editAssetName').value = asset.name;
            document.getElementById('editAssetCategory').value = asset.category;
            document.getElementById('editAssetLocation').value = asset.location;
            document.getElementById('editAssetStatus').value = asset.status;
            
            editError.style.display = 'none'; 
            editModal.classList.add('active');
        }
    };

    const attachEditDeleteListeners = () => {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => {
                e.stopPropagation();
                populateEditModal(parseInt(e.currentTarget.dataset.id));
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                e.stopPropagation();
                handleDeleteAsset(parseInt(e.currentTarget.dataset.id));
            };
        });
    };
    
    // --- EVENT HANDLERS ---
    
    // Location Filter Change Handler
    locationFilter.addEventListener('change', (e) => {
        currentLocation = e.target.value; 
        
        // Reset category and search inputs when location changes
        categoryFilter.value = 'All';
        searchInput.value = '';
        
        renderTable(); 
    });

    // Category Filter Change Handler
    categoryFilter.addEventListener('change', renderTable);
    
    // Search Input Handler
    searchInput.addEventListener('input', renderTable);
    
    // CSV Export Handler
    exportCsvBtn.addEventListener('click', () => {
        const filteredAssets = getFilteredAssets(); 
        if (filteredAssets.length === 0) {
            showToast('No assets to export based on current filters.', 'warning');
            return;
        }

        const locationName = currentLocation === 'All' ? 'Master_Inventory' : currentLocation.replace(/\s/g, '_');
        
        let csvContent = "Asset Tag,Name,Category,Location,Status,Date Added\n";
        
        filteredAssets.forEach(asset => {
            const row = [
                asset.tag,
                asset.name,
                asset.category,
                asset.location,
                asset.status,
                asset.dateAdded
            ].map(item => `"${item}"`).join(','); 
            
            csvContent += row + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${locationName}_Assets_Export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV export started.');
    });


    // --- UI TOGGLES ---

    addAssetForm.addEventListener('submit', handleAddAsset);
    editAssetForm.addEventListener('submit', handleEditAsset);


    openAddFormBtn.addEventListener('click', () => {
        if (currentLocation === 'All') {
            showToast("Please select a specific Office or Laboratory first.", 'warning');
            return;
        }
        openAddFormBtn.style.display = 'none';
        addAssetForm.style.display = 'flex';
        assetLocationInput.value = currentLocation; 
        document.getElementById('assetTag').focus();
    });

    cancelAddBtn.addEventListener('click', () => {
        addAssetForm.reset();
        addAssetForm.style.display = 'none';
        openAddFormBtn.style.display = 'block';
        addError.style.display = 'none';
    });

    closeModalBtn.addEventListener('click', () => {
        editModal.classList.remove('active');
    });

    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.remove('active');
    });

    window.onclick = (event) => {
        if (event.target === editModal) {
            editModal.classList.remove('active');
        }
    };


    // --- AUTHENTICATION & INITIALIZATION ---
    
    const isAuthenticated = () => localStorage.getItem('authenticated') === 'true';

    const login = () => {
        loginPage.classList.remove('active');
        dashboardPage.classList.add('active');
        localStorage.setItem('authenticated', 'true');
        // Initial dashboard setup after successful login
        populateLocationFilter();
        // Call renderTable, which calls updateMetrics to fix the visibility state
        renderTable(); 
    };

    const logout = () => {
        loginPage.classList.add('active');
        dashboardPage.classList.remove('active');
        localStorage.removeItem('authenticated');
        loginForm.reset();
        loginError.style.display = 'none';
        
        currentLocation = 'All'; 
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple mock login logic
        if (username === 'admin' && password === 'admin') {
            login();
        } else {
            loginError.textContent = 'Invalid username or password.';
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', logout);

    // Initial check on load
    if (isAuthenticated()) {
        login(); 
    } else {
        // Ensure the warning is displayed on load if not logged in
        if(locationWarning) locationWarning.style.display = 'block';
    }
});
