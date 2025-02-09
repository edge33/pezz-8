import { renderDisplay } from "./display/display";
import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from "./display/specs";
import { isKeyPressed } from "./keyboard";
import Uint16Stack from "./stack";


const RAM = new Uint8Array(4096)
let programCounter = 0

const display = new Array(DISPLAY_WIDTH * DISPLAY_HEIGHT).fill(0);


export const loadRomFile = (romFile: Uint8Array) => {
    let startIndex = 0x200

    for (let i = 0; i < romFile.length; i++) {
        RAM[startIndex++] = romFile[i]
    }
    programCounter = 0x200
}


/**
 * initial position for the ram should be 200 (512 in decimal)
 * as indices 000 to 1FF are reserved for the CHIP-8 Interpreter
*/

/** 050 (80) - 09F (159) are reserved for fonts  */

const FONTSET = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];

// Load font in memory starting at 0x050
for (let i = 0; i < FONTSET.length; i++) {
    RAM[0x050 + i] = FONTSET[i];
}



let iRegister = 0 & 0xFFFF

const stack = new Uint16Stack(16)

let delayTimer = 0 & 0xFFFF
let soundTimer = 0 & 0xFFFF


let keyPressed = -1;

const V = new Array<number>(16)

// fetch - decode - execute

let doRenderDisplay = false;

const execute = () => {

        
    //fetch

    const instructionPartOne = RAM[programCounter]
    const instructionPartTwo = RAM[programCounter + 1]
    const instruction = instructionPartOne << 8 | instructionPartTwo



    programCounter += 2


    //decode 
    const nibble1 = (instruction & 0xF000) >> 12; // First nibble
    let X = (instruction & 0x0F00) >> 8;       // Second nibble (X)
    let Y = (instruction & 0x00F0) >> 4;       // Third nibble (Y)
    const N = instruction & 0x000F;              // Last Nibble (4 bit meno significativi)
    const NN = instruction & 0x00FF;
    const NNN = instruction & 0x0FFF;


    //execute
    switch (nibble1) {
        case 0x00: {

            if (X === 0 && Y === 0x0E) {

                switch (N) {
                    case 0: {
                        display.fill(0)
                        break;
                    }
                    case 0x0E: {

                        programCounter = stack.pop()

                        break;
                    }
                }


            }


            // otherwise it is the Execute machine language routine
            // noop



            break;

        }
        case 0x01: {
            programCounter = NNN
            break;
        }
        case 0x02: {



            stack.push(programCounter)
            programCounter = NNN


            break;
        }
        case 0x03: {


            if (V[X] === NN) {
                programCounter += 2
            }

            break;
        }
        case 0x04: {



            if (V[X] !== NN) {
                programCounter += 2
            }

            break;
        }
        case 0x05: {


            if (V[X] === V[Y]) {
                programCounter += 2
            }


            break;
        }
        case 0x06: {

            V[X] = NN
            break;
        }
        case 0x07: {
            V[X] = (V[X] + NN) & 0xFF;
            break;
        }
        case 0x08: {

            switch (N) {
                case 0x00: {
                    V[X] = V[Y]
                    break;
                }
                case 0x01: {
                    V[X] = V[X] | V[Y]
                    V[0x0F] = 0
                    break;
                }
                case 0x02: {
                    V[X] = V[X] & V[Y]
                    V[0x0F] = 0
                    break;
                }
                case 0x03: {
                    V[X] = V[X] ^ V[Y]
                    V[0x0F] = 0
                    break;
                }
                case 0x04: {
                    const result = V[X] + V[Y];
                    V[X] = result & 0xFF;
                    V[0x0F] = result > 255 ? 1 : 0;
                    break;
                }
                case 0x05: {
                    const borrow = V[X] >= V[Y] ? 1 : 0;
                    V[X] = (V[X] - V[Y]) & 0xFF;
                    V[0x0F] = borrow;
                    break;
                }
                case 0x06: {


                    // Todo: allow COSMAC and CHIP-48

                    // this is classic COSMAC

                    V[X] = V[Y]
                    const shiftOut = V[X] & 1
                    V[X] = V[X] >> 1;    // Shift VX right by 1
                    V[0x0F] = shiftOut
                    break;


                    // this is CHIP-48 and SUPER-CHIP



                    break;
                }
                case 0x07: {
                    const borrow = (V[Y] >= V[X]) ? 1 : 0;
                    V[X] = (V[Y] - V[X]) & 0xFF;
                    V[0x0F] = borrow
                    break;

                }


                case 0x0E: {

                    // Todo: allow COSMAC and CHIP-48

                    // this is classic COSMAC

                    V[X] = V[Y];
                    const shiftOut = (V[X] & 0x80) >> 7;
                    V[X] = (V[X] << 1) & 0xFF;
                    V[0x0F] = shiftOut




                    break;
                }
            }



            break;
        }
        case 0x09: {

            if (N === 0) {
                if (V[X] !== V[Y]) {
                    programCounter += 2;
                }
            }
            break;
        }
        case 0x0A:
            iRegister = NNN
            break;
        case 0x0B:


            programCounter = NNN + V[0]

            // if CHIP-48 and SUPER-CHIP
            /*
            const XNN = (NN + (X << 8)); 

            programCounter = XNN + V[X];  // Set PC to XNN + VX[X]
            */



            break;
        case 0x0C:
            V[X] = Math.floor(Math.random() * 256) & NN
            break;
        case 0x0D:
            const VX = V[X] & (DISPLAY_WIDTH - 1);
            const VY = V[Y] & (DISPLAY_HEIGHT - 1);
            V[0x0F] = 0

            for (let i = 0; i < N; i++) {

                if (VY + i >= DISPLAY_HEIGHT) {
                    break;
                }

                const spriteByte = RAM[iRegister + i]

                for (let j = 0; j < 8; j++) {

                    if (VX + j >= DISPLAY_WIDTH) {
                        break;
                    }

                    const pixelIndex = (VY + i) * DISPLAY_WIDTH + (VX + j);
                    const spritePixel = (spriteByte >> (7 - j)) & 1;

                    if (spritePixel === 1) {
                        if (display[pixelIndex] === 1) {
                            display[pixelIndex] = 0;
                            V[0xF] = 1;
                        } else {
                            display[pixelIndex] = 1;
                        }
                    }
                }


            }
            doRenderDisplay = true;

            break;
        case 0x0E:


            switch (N) {
                case 0x0E: {

                    if (isKeyPressed(V[X])) {
                        programCounter += 2
                    }


                    break;
                }
                case 0x01: {

                    if (!isKeyPressed(V[X])) {
                        programCounter += 2
                    }

                    break;
                }
            }

            break;
        case 0x0F:


            switch (Y) {
                case 0x00: {

                    switch (N) {
                        case 0x07: {
                            V[X] = delayTimer
                            break
                        }
                        case 0x0A: {

                            // TODO:check if can be implemented on key up
                            for (let i = 0; i < 16; i++) {
                                if (isKeyPressed(i)) {    
                                    console.log('in loo', keyPressed)
                                    keyPressed = i;
                                    break
                                }
                            }

                            if (keyPressed !== -1) {
                                console.log(keyPressed)
                                V[X] = keyPressed
                                keyPressed = -1
                            } else {
                                console.log('staying');
                                
                                programCounter -= 2
                            }

                            break;





                        }
                    }

                    if (N === 0x07) {
                    }

                    break;
                }
                case 0x01: {

                    switch (N) {
                        case 0x05: {

                            delayTimer = V[X]

                            break;
                        }
                        case 0x08: {

                            soundTimer = V[X]

                            break;
                        }
                        case 0x0E: {
                            iRegister += V[X]

                            // amiga quirk - fix for spacefight 2091

                            if (iRegister > 0x0FFF) {
                                V[0x0F] = 1
                            }

                            break;
                        }
                    }


                    break;
                }

                case 0x03: {
                    if (N === 0x03) {
                        const value = V[X]
                        RAM[iRegister] = Math.floor(value / 100);
                        RAM[iRegister + 1] = Math.floor((value / 10) % 10);
                        RAM[iRegister + 2] = value % 10;
                        break;
                    }
                    break;
                }

                case 0x05: {

                    //TODO: IMPLEMENT QUIRK

                    if (N === 5) {

                        for (let i = 0; i <= X; i++) {
                            RAM[iRegister++] = V[i]
                        }
                    }
                    break;
                }
                case 0x06: {


                    //TODO IMPLEMENT QUIRK

                    if (N === 5) {

                        for (let i = 0; i <= X; i++) {
                            V[i] = RAM[iRegister++]
                        }
                    }


                    break;
                }

            }



            break;
    }





}

const printout = () => {

    for (let line = 0; line < DISPLAY_HEIGHT; line++) {
        const row = display
            .slice(line * DISPLAY_WIDTH, (line + 1) * DISPLAY_WIDTH)
            .map(pixel => (pixel ? "█" : " "));  // Convert 1 → "█", 0 → " "
        console.log(row.join("")); // Print the row
    }
    console.log();

    console.log()
}

export const start = () => {
    run()
}




const CHIP8_CLOCK_HZ = 700;  // CHIP-8 typical speed
const FRAME_RATE = 60;       // Browser refresh rate (60 FPS)
const INSTRUCTIONS_PER_FRAME = Math.floor(CHIP8_CLOCK_HZ / FRAME_RATE);



const run = () => {

    const doRun = () => {
        for (let i = 0; i < INSTRUCTIONS_PER_FRAME; i++) {
            execute() 
        }
        if (delayTimer > 0) {
            delayTimer--;
        }
        if (soundTimer > 0) {
            soundTimer--;
        }
        renderDisplay(display);    // Refresh screen
        

        requestAnimationFrame(doRun);
    }
    requestAnimationFrame(doRun);

    // setInterval(() => {
    //     for (let i = 0; i < INSTRUCTIONS_PER_FRAME; i++) {
    //         execute() 
    //     }
    
    //     renderDisplay(display);    // Refresh screen
    // }, 1000 / FRAME_RATE)

}


