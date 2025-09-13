let currentEditTaskId = null;
let currentUploadTaskId = null;
let currentFilter = 'all';
let searchQuery = '';

async function toggleTask(taskId) {
    try {
        const response = await fetch(`/tasks/${taskId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert('Ошибка при обновлении задачи');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при обновлении задачи');
    }
}

async function deleteTask(taskId) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        try {
            const response = await fetch(`/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                window.location.reload();
            } else {
                alert('Ошибка при удалении задачи');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при удалении задачи');
        }
    }
}

function editTask(taskId, currentTitle, currentDueDate) {
    currentEditTaskId = taskId;
    document.getElementById('editTaskInput').value = currentTitle;
    document.getElementById('editTaskDueDate').value = currentDueDate || '';
    document.getElementById('editModal').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('editTaskInput').focus();
    }, 100);
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditTaskId = null;
    document.getElementById('editTaskInput').value = '';
    document.getElementById('editTaskDueDate').value = '';
}

function clearDueDate() {
    document.getElementById('editTaskDueDate').value = '';
}

async function saveTask() {
    const newTitle = document.getElementById('editTaskInput').value.trim();
    const newDueDate = document.getElementById('editTaskDueDate').value;
    
    if (!newTitle) {
        alert('Название задачи не может быть пустым');
        return;
    }

    if (newDueDate) {
        const selectedDate = new Date(newDueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            alert('Дата завершения не может быть раньше сегодняшнего дня');
            return;
        }
    }

    if (!currentEditTaskId) {
        alert('Ошибка: ID задачи не найден');
        return;
    }

    try {
        const requestBody = { title: newTitle };
        if (newDueDate) {
            requestBody.dueDate = newDueDate;
        } else {
            requestBody.dueDate = null;
        }

        const response = await fetch(`/tasks/${currentEditTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            closeEditModal();
            window.location.reload();
        } else {
            alert('Ошибка при сохранении задачи');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при сохранении задачи');
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeEditModal();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.target.id === 'editTaskInput') {
        saveTask();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const title = document.querySelector('.header h1');
    if (title) {
        const text = title.textContent;
        title.textContent = '';
        title.style.borderRight = '2px solid #ffd700';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                title.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                setTimeout(() => {
                    title.style.borderRight = 'none';
                }, 1000);
            }
        };
        
        setTimeout(typeWriter, 500);
    }
});

function filterTasks(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    applyFilters();
}

function searchTasks() {
    const searchInput = document.getElementById('searchInput');
    searchQuery = searchInput.value.toLowerCase().trim();
    applyFilters();
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    searchQuery = '';
    applyFilters();
}

function applyFilters() {
    const taskItems = document.querySelectorAll('.task-item');
    let visibleCount = 0;
    
    taskItems.forEach(item => {
        const isCompleted = item.classList.contains('completed');
        const taskTitle = item.querySelector('.task-title').textContent.toLowerCase();
        
        let showByFilter = true;
        if (currentFilter === 'active') {
            showByFilter = !isCompleted;
        } else if (currentFilter === 'completed') {
            showByFilter = isCompleted;
        }
        
        let showBySearch = true;
        if (searchQuery) {
            showBySearch = taskTitle.includes(searchQuery);
        }
        
        const shouldShow = showByFilter && showBySearch;
        item.style.display = shouldShow ? 'flex' : 'none';
        
        if (shouldShow) {
            visibleCount++;
        }
    });
    
    const emptyState = document.querySelector('.empty-state');
    const tasksList = document.querySelector('.tasks-list');
    
    if (visibleCount === 0 && tasksList) {
        if (!emptyState) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state filtered-empty';
            emptyDiv.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>Задачи не найдены</h3>
                <p>Попробуйте изменить фильтр или поисковый запрос</p>
            `;
            tasksList.parentNode.appendChild(emptyDiv);
        }
        if (tasksList) tasksList.style.display = 'none';
    } else {
        const filteredEmpty = document.querySelector('.filtered-empty');
        if (filteredEmpty) {
            filteredEmpty.remove();
        }
        if (tasksList) tasksList.style.display = 'block';
    }
    
    updateStats();
}

function updateStats() {
    const taskItems = document.querySelectorAll('.task-item');
    const completedTasks = document.querySelectorAll('.task-item.completed');
    const activeTasks = taskItems.length - completedTasks.length;
    
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers[0]) statNumbers[0].textContent = taskItems.length;
    if (statNumbers[1]) statNumbers[1].textContent = completedTasks.length;
    if (statNumbers[2]) statNumbers[2].textContent = activeTasks;
}

function validateTaskForm(event) {
    const dueDateInput = event.target.querySelector('input[name="dueDate"]');
    if (dueDateInput && dueDateInput.value) {
        const selectedDate = new Date(dueDateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            event.preventDefault();
            alert('Дата завершения не может быть раньше сегодняшнего дня');
            return false;
        }
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.querySelector('.add-task-form');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', validateTaskForm);
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterTasks(filter);
        });
    });
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchTasks();
            }
        });
        
        searchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                searchQuery = this.value.toLowerCase().trim();
                applyFilters();
            }, 300);
        });
    }

    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.querySelector('.upload-area');
    
    if (fileInput && uploadArea) {
        fileInput.addEventListener('change', handleFileSelect);
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelect({ target: fileInput });
            }
        });
        
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
    }
});

function openFileUpload(taskId) {
    currentUploadTaskId = taskId;
    document.getElementById('uploadModal').style.display = 'block';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    currentUploadTaskId = null;
    clearSelectedFile();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 5MB');
        clearSelectedFile();
        return;
    }
    
    const selectedFileDiv = document.getElementById('selectedFile');
    const fileIcon = document.getElementById('fileIcon');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const uploadBtn = document.getElementById('uploadBtn');
    
    let iconClass = 'fas fa-file';
    if (file.type.startsWith('image/')) iconClass = 'fas fa-image';
    else if (file.type === 'application/pdf') iconClass = 'fas fa-file-pdf';
    else if (file.type.includes('word')) iconClass = 'fas fa-file-word';
    else if (file.type.includes('excel')) iconClass = 'fas fa-file-excel';
    else if (file.type.includes('zip')) iconClass = 'fas fa-file-archive';
    
    fileIcon.className = iconClass;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    selectedFileDiv.style.display = 'block';
    uploadBtn.disabled = false;
}

function clearSelectedFile() {
    document.getElementById('fileInput').value = '';
    document.getElementById('selectedFile').style.display = 'none';
    document.getElementById('uploadBtn').disabled = true;
}

async function uploadFile() {
    if (!currentUploadTaskId) {
        alert('Ошибка: ID задачи не найден');
        return;
    }
    
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Выберите файл для загрузки');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Загружаем...';
    
    try {
        const response = await fetch(`/tasks/${currentUploadTaskId}/upload`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert('Файл успешно загружен!');
            closeUploadModal();
            window.location.reload();
        } else {
            alert(result.message || 'Ошибка при загрузке файла');
        }
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        alert('Ошибка при загрузке файла');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Загрузить';
    }
}

function downloadFile(taskId, attachmentId) {
    window.open(`/tasks/${taskId}/files/${attachmentId}/download`, '_blank');
}

async function deleteFile(taskId, attachmentId) {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
        return;
    }
    
    try {
        const response = await fetch(`/tasks/${taskId}/files/${attachmentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            window.location.reload();
        } else {
            alert(result.message || 'Ошибка при удалении файла');
        }
    } catch (error) {
        console.error('Ошибка удаления файла:', error);
        alert('Ошибка при удалении файла');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
