import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Container } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TeacherPage() {
  const [lectureData, setLectureData] = useState({
    summary: '',
    wordFilePath: '',
    presentationFileUrl: '',
    statistics: [],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (lectureData.wordFilePath) {
        fetchWordFile();
      }
      fetchPresentationFile();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (lectureData.presentationFileUrl) {
        URL.revokeObjectURL(lectureData.presentationFileUrl);
      }
    };
  }, [lectureData.wordFilePath, lectureData.presentationFileUrl]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
  
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
  
    if (!file) {
      console.error('No file selected');
      alert('Please select a file to upload');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch('http://127.0.0.1:8000/upload-audio', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Обработка ответа сервера
      const data = await response.json();
      console.log('File uploaded successfully:', data);
      // Обновление состояния и др.
    } catch (error) {
      console.error('There was a problem with the file upload:', error);
      alert('Error during file upload: ' + error.message);
    }
  };
  
  
  

  const processText = async (recognizedText) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: recognizedText }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const processedData = await response.json();
      setLectureData({
        ...lectureData,
        summary: processedData.summary,
        wordFilePath: processedData.wordFilePath
      });
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
  };

  const fetchWordFile = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/download-word/${lectureData.wordFilePath}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Здесь можно обработать полученный файл
      // Например, сохранить его или обновить ссылку для скачивания
    } catch (error) {
      console.error('Error fetching word file:', error);
    }
  };
  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/performance');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setLectureData({
          ...lectureData,
          summary: data.summary,
          wordFilePath: data.wordFilePath,
          presentationFileUrl: `http://127.0.0.1:8000/download-presentation`
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };
  


  const fetchPresentationFile = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/download-presentation`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);

      setLectureData(prevData => ({
        ...prevData,
        presentationFileUrl: fileUrl,
      }));
    } catch (error) {
      console.error('Error fetching presentation file:', error);
    }
  };

  const chartData = {
    labels: lectureData?.statistics ? lectureData.statistics.map(stat => stat.chapter) : [],
    datasets: [
      {
        label: 'Проходимость',
        data: lectureData?.statistics ? lectureData.statistics.map(stat => stat.performance) : [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };
  

  return (   
    <Container>
    <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
      <Box component="form" onSubmit={handleFileUpload}>
        <Input 
          type="file" 
          id="fileInput"
          required 
          fullWidth 
          inputProps={{
            accept: 'image/*,video/*,audio/*'
          }} 
        />
        <Button type="submit" variant="contained" color="primary">
          Загрузить
        </Button>
      </Box>

      {lectureData.summary && (
        <Box mt={4}>
          <Typography variant="h5">Конспект лекции</Typography>
          <Typography paragraph>{lectureData.summary}</Typography>

          {lectureData.wordFilePath && (
    <Box mt={2}>
        <Link href={`http://127.0.0.1:8000/download-word`} download="lecture.docx">
            Скачать файл Word
        </Link>
    </Box>
)}

{lectureData.presentationFileUrl && (
    <Box mt={2}>
        <Link href={`http://127.0.0.1:8000/download-presentation`} download="lecture.pptx">
            Скачать презентацию
        </Link>
    </Box>
)}


<Box mt={4}>
  <Typography variant="h5" style={{ marginTop: '20px' }}>График проходимости</Typography>
  <Bar data={chartData} />
</Box>
</Box>
)}
</Paper>
</Container>
);
}
