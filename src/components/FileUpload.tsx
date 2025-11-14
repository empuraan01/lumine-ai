'use client'
import {useDropzone} from 'react-dropzone'
import React from 'react'
import { Inbox } from 'lucide-react';
import { uploadToS3 } from '@/lib/s3';

const FileUpload = () => {
  const { getRootProps, getInputProps } = useDropzone({
    accept : { 'application/pdf': ['.pdf']},
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log(acceptedFiles);
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024){
        alert("File size is too large. Please upload a file less than 10MB.");
        return;
      }

      try {
        const data = await uploadToS3(file);
        console.log("File uploaded successfully...", data);
      } catch (error) {
        console.error("Error uploading file...", error);
      }
    }
  });
  return (
    <div className = 'p-2 bg-white rounded-xl'>
        <div {...getRootProps({
            className: 'border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col'
        })}>
        <input {...getInputProps()}/>
        <>
            <Inbox className = 'w-10 h-10 text-blue-500'/>
            <p className = 'mt-2 text-sm text-slate-400'>Drag and drop your PDF here or click to upload</p>
        </>

        </div>
    </div>
  );
}

export default FileUpload