import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FileUploader({ onFileUploaded }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file) => {
    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleChange = (e) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const fileUrl = URL.createObjectURL(file);
      setUploadComplete(true);
      setTimeout(() => {
        onFileUploaded(file, fileUrl);
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setUploadComplete(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/50' 
                : 'border-slate-200 hover:border-slate-300 bg-white/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <motion.div
              animate={{ y: dragActive ? -5 : 0 }}
              className="flex flex-col items-center"
            >
              <div className={`p-4 rounded-2xl mb-6 transition-colors ${
                dragActive ? 'bg-indigo-100' : 'bg-slate-100'
              }`}>
                <Upload className={`w-10 h-10 ${
                  dragActive ? 'text-indigo-600' : 'text-slate-400'
                }`} />
              </div>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Drop your research paper here
              </h3>
              <p className="text-slate-500 mb-4">
                or click to browse files
              </p>
              <p className="text-sm text-slate-400">
                PDF files up to 10MB, 100 pages max
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-100">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {uploadComplete ? (
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              ) : !uploading ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              ) : null}
            </div>

            {!uploadComplete && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-6 h-12 bg-indigo-600 hover:bg-indigo-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Start Analysis'
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-red-500 text-sm"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}