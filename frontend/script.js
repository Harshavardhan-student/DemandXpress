let currentPage = 1;
const ITEMS_PER_PAGE = 10;
const API_URL = 'http://localhost:3000'; // Backend API URL

// Error handling utility
const showError = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
};

// Form validation patterns
const patterns = {
    email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^\d{10}$/
};

// DOM Elements
const contactForm = document.getElementById('contactForm');
const contactsList = document.getElementById('contactsList');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');

// Validate form fields
function validateField(input, pattern) {
    const errorElement = document.getElementById(`${input.id}Error`);
    const isValid = pattern ? pattern.test(input.value) : input.value.trim() !== '';
    
    if (!isValid) {
        let message = 'This field is required';
        if (input.value && pattern) {
            message = input.id === 'email' ? 'Invalid email format' : 'Phone must be 10 digits';
        }
        errorElement.textContent = message;
        input.classList.add('error');
    } else {
        errorElement.textContent = '';
        input.classList.remove('error');
    }
    
    return isValid;
}

// Fetch contacts from API
async function fetchContacts(page = 1) {
    try {
        const response = await fetch(`${API_URL}/contacts?page=${page}&limit=${ITEMS_PER_PAGE}`);
        const data = await response.json();
        displayContacts(data.contacts);
        updatePagination(data.pagination);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        showError('Failed to load contacts');
    }
}

// Display contacts in the list
function displayContacts(contacts) {
    contactsList.innerHTML = contacts.map(contact => `
        <div class="contact-card" data-id="${contact.id}">
            <div class="contact-info">
                <h3>${contact.name}</h3>
                <p>${contact.email}</p>
                <p>${contact.phone}</p>
            </div>
            <button class="delete-btn" onclick="deleteContact('${contact.id}')">Delete</button>
        </div>
    `).join('');
}

// Add new contact
async function addContact(contactData) {
    try {
        const response = await fetch(`${API_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add contact');
        }
        
        fetchContacts(currentPage);
    } catch (error) {
        console.error('Error adding contact:', error);
    }
}

// Delete contact
async function deleteContact(id) {
    try {
        const response = await fetch(`${API_URL}/contacts/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete contact');
        }
        
        fetchContacts(currentPage);
    } catch (error) {
        console.error('Error deleting contact:', error);
    }
}

// Update pagination controls
function updatePagination(pagination) {
    const { currentPage, totalPages, totalContacts, hasNextPage, hasPrevPage } = pagination;
    prevPageBtn.disabled = !hasPrevPage;
    nextPageBtn.disabled = !hasNextPage;
    currentPageSpan.textContent = `Page ${currentPage} of ${totalPages} (${totalContacts} contacts)`;
}

// Event Listeners
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    const isValidName = validateField(nameInput);
    const isValidEmail = validateField(emailInput, patterns.email);
    const isValidPhone = validateField(phoneInput, patterns.phone);
    
    if (isValidName && isValidEmail && isValidPhone) {
        const contactData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim()
        };
        
        await addContact(contactData);
        contactForm.reset();
    }
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchContacts(currentPage);
    }
});

nextPageBtn.addEventListener('click', () => {
    currentPage++;
    fetchContacts(currentPage);
});

// Input validation on blur
document.getElementById('name').addEventListener('blur', (e) => validateField(e.target));
document.getElementById('email').addEventListener('blur', (e) => validateField(e.target, patterns.email));
document.getElementById('phone').addEventListener('blur', (e) => validateField(e.target, patterns.phone));

// Initial load
fetchContacts();