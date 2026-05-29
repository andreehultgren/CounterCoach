import React from 'react'
import {createRoot} from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import '../colors_and_styles.css'
import App from './App'
import theme from './theme'

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme} defaultMode="light" noSsr disableTransitionOnChange>
            <CssBaseline />
            <App/>
        </ThemeProvider>
    </React.StrictMode>
)
