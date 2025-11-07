import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'

// 导入组件样式
import './components/Header.css'
import './components/Dashboard.css'
import './components/WordBookList.css'
import './components/WordBookCard.css'
import './components/WordBookImporter.css'
import './components/StudyPlanCreator.css'
import './components/StudySession.css'
import './components/StudyModeSelector.css'
import './components/SpellingExercise.css'
import './components/ChoiceExercise.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)