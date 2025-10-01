import { useState, useRef } from 'react';
import { useTaskContext } from '../hooks/useTaskContext';

function UploadModal({ isOpen, onClose, taskId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { addAttachment } = useTaskContext();

  const handleFileSelect = (file) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile || !taskId) {
      alert('Выберите файл для загрузки');
      return;
    }

    try {
      console.log('Загрузка файла:', { taskId, fileName: selectedFile.name });
      await addAttachment(taskId, selectedFile);
      console.log('Файл успешно загружен');
      alert('Файл успешно загружен!');
      handleClose();
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      alert('Ошибка загрузки файла: ' + error.message);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'fas fa-image';
    if (mimetype === 'application/pdf') return 'fas fa-file-pdf';
    if (mimetype.includes('word')) return 'fas fa-file-word';
    if (mimetype.includes('excel')) return 'fas fa-file-excel';
    if (mimetype.includes('zip')) return 'fas fa-file-archive';
    return 'fas fa-file';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Прикрепить файл к задаче</h3>
          <button className="close" onClick={handleClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div
            className={`upload-area ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadAreaClick}
          >
            <div className="upload-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <p>Перетащите файл сюда или нажмите для выбора</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              style={{ display: 'none' }}
            />
            <div className="file-info">
              <small>Максимальный размер: 5MB</small><br />
              <small>Поддерживаемые форматы: изображения, PDF, документы, архивы</small>
            </div>
          </div>
          
          {selectedFile && (
            <div className="selected-file">
              <div className="file-preview">
                <i className={getFileIcon(selectedFile.type)}></i>
                <div className="file-details">
                  <span>{selectedFile.name}</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="btn-remove-file"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Отмена
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            Загрузить
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
