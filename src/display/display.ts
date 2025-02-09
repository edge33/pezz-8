import classes from './display.module.css'
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from './specs';

const PIXEL_SIZE = 8;

enum Colors {
    black = 'black',
    blue = 'white'
}

const canvasWidth = DISPLAY_WIDTH * PIXEL_SIZE
const canvasHeight = DISPLAY_HEIGHT * PIXEL_SIZE

const canvas = document.querySelector<HTMLCanvasElement>('#display') as HTMLCanvasElement
canvas.className = classes.display

const ctx = canvas.getContext("2d");


canvas.height = canvasHeight;
canvas.width = canvasWidth;


export const renderDisplay = (displayState: number[]) => {
    if (!canvas) {
        console.error("Canvas not found!");
        return;
    }

    if (!ctx) {
        console.error("Canvas context not supported!");
        return;
    }

    for (let y = 0; y < DISPLAY_HEIGHT; y++) {
        for (let x = 0; x < DISPLAY_WIDTH; x++) {


            const value = displayState[y * DISPLAY_WIDTH + x]
            ctx.fillStyle = value === 1 ? Colors.blue : Colors.black


            ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);

        }
        
    }
};