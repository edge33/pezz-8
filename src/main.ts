import './style.css'
import './display/display'
import './fileUploader'
import './keyboard'


import { start } from './chip8.ts'


const startButton = document.querySelector<HTMLButtonElement>('#start')

if (!startButton) {
    throw new Error("Start button not found")
}

startButton.addEventListener('click', () => {
    console.log('Starting emulator')
    start()
})