import { renderDisplay } from './display/display'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from './display/specs'
import { isKeyPressed, isKeyReleased, resetKeyReleased } from './keyboard'
import Uint16Stack from './stack'

const RAM = new Uint8Array(4096)
let programCounter = 0

const display = new Array(DISPLAY_WIDTH * DISPLAY_HEIGHT).fill(0)

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
    0xf0,
    0x90,
    0x90,
    0x90,
    0xf0, // 0
    0x20,
    0x60,
    0x20,
    0x20,
    0x70, // 1
    0xf0,
    0x10,
    0xf0,
    0x80,
    0xf0, // 2
    0xf0,
    0x10,
    0xf0,
    0x10,
    0xf0, // 3
    0x90,
    0x90,
    0xf0,
    0x10,
    0x10, // 4
    0xf0,
    0x80,
    0xf0,
    0x10,
    0xf0, // 5
    0xf0,
    0x80,
    0xf0,
    0x90,
    0xf0, // 6
    0xf0,
    0x10,
    0x20,
    0x40,
    0x40, // 7
    0xf0,
    0x90,
    0xf0,
    0x90,
    0xf0, // 8
    0xf0,
    0x90,
    0xf0,
    0x10,
    0xf0, // 9
    0xf0,
    0x90,
    0xf0,
    0x90,
    0x90, // A
    0xe0,
    0x90,
    0xe0,
    0x90,
    0xe0, // B
    0xf0,
    0x80,
    0x80,
    0x80,
    0xf0, // C
    0xe0,
    0x90,
    0x90,
    0x90,
    0xe0, // D
    0xf0,
    0x80,
    0xf0,
    0x80,
    0xf0, // E
    0xf0,
    0x80,
    0xf0,
    0x80,
    0x80, // F
]

// Load font in memory starting at 0x050
for (let i = 0; i < FONTSET.length; i++) {
    RAM[0x050 + i] = FONTSET[i]
}

let iRegister = 0 & 0xffff

const stack = new Uint16Stack(16)

let delayTimer = 0 & 0xffff
let soundTimer = 0 & 0xffff

let holdForKey = false
let keyReleased = -1

const V = new Array<number>(16)

// fetch - decode - execute

let doRender = false

const execute = () => {
    //fetch

    const instructionPartOne = RAM[programCounter]
    const instructionPartTwo = RAM[programCounter + 1]
    const instruction = (instructionPartOne << 8) | instructionPartTwo

    programCounter += 2

    //decode
    const nibble1 = (instruction & 0xf000) >> 12 // First nibble
    const X = (instruction & 0x0f00) >> 8 // Second nibble (X)
    const Y = (instruction & 0x00f0) >> 4 // Third nibble (Y)
    const N = instruction & 0x000f // Last Nibble (4 bit meno significativi)
    const NN = instruction & 0x00ff
    const NNN = instruction & 0x0fff

    //execute
    switch (nibble1) {
        case 0x00: {
            if (X === 0 && Y === 0x0e) {
                switch (N) {
                    case 0: {
                        display.fill(0)
                        break
                    }
                    case 0x0e: {
                        programCounter = stack.pop()

                        break
                    }
                }
            }

            // otherwise it is the Execute machine language routine
            // noop

            break
        }
        case 0x01: {
            programCounter = NNN
            break
        }
        case 0x02: {
            stack.push(programCounter)
            programCounter = NNN

            break
        }
        case 0x03: {
            if (V[X] === NN) {
                programCounter += 2
            }

            break
        }
        case 0x04: {
            if (V[X] !== NN) {
                programCounter += 2
            }

            break
        }
        case 0x05: {
            if (V[X] === V[Y]) {
                programCounter += 2
            }

            break
        }
        case 0x06: {
            V[X] = NN
            break
        }
        case 0x07: {
            V[X] = (V[X] + NN) & 0xff
            break
        }
        case 0x08: {
            switch (N) {
                case 0x00: {
                    V[X] = V[Y]
                    break
                }
                case 0x01: {
                    V[X] = V[X] | V[Y]
                    V[0x0f] = 0
                    break
                }
                case 0x02: {
                    V[X] = V[X] & V[Y]
                    V[0x0f] = 0
                    break
                }
                case 0x03: {
                    V[X] = V[X] ^ V[Y]
                    V[0x0f] = 0
                    break
                }
                case 0x04: {
                    const result = V[X] + V[Y]
                    V[X] = result & 0xff
                    V[0x0f] = result > 255 ? 1 : 0
                    break
                }
                case 0x05: {
                    const borrow = V[X] >= V[Y] ? 1 : 0
                    V[X] = (V[X] - V[Y]) & 0xff
                    V[0x0f] = borrow
                    break
                }
                case 0x06: {
                    // Todo: allow COSMAC and CHIP-48

                    // this is classic COSMAC

                    V[X] = V[Y]
                    const shiftOut = V[X] & 1
                    V[X] = V[X] >> 1 // Shift VX right by 1
                    V[0x0f] = shiftOut
                    break

                    // this is CHIP-48 and SUPER-CHIP

                    break
                }
                case 0x07: {
                    const borrow = V[Y] >= V[X] ? 1 : 0
                    V[X] = (V[Y] - V[X]) & 0xff
                    V[0x0f] = borrow
                    break
                }

                case 0x0e: {
                    // Todo: allow COSMAC and CHIP-48

                    // this is classic COSMAC

                    V[X] = V[Y]
                    const shiftOut = (V[X] & 0x80) >> 7
                    V[X] = (V[X] << 1) & 0xff
                    V[0x0f] = shiftOut

                    break
                }
            }

            break
        }
        case 0x09: {
            if (N === 0) {
                if (V[X] !== V[Y]) {
                    programCounter += 2
                }
            }
            break
        }
        case 0x0a:
            iRegister = NNN
            break
        case 0x0b:
            programCounter = NNN + V[0]

            // if CHIP-48 and SUPER-CHIP
            /*
            const XNN = (NN + (X << 8));

            programCounter = XNN + V[X];  // Set PC to XNN + VX[X]
            */

            break
        case 0x0c:
            V[X] = Math.floor(Math.random() * 256) & NN
            break
        case 0x0d: {
            const VX = V[X] & (DISPLAY_WIDTH - 1)
            const VY = V[Y] & (DISPLAY_HEIGHT - 1)
            V[0x0f] = 0

            for (let i = 0; i < N; i++) {
                if (VY + i >= DISPLAY_HEIGHT) {
                    break
                }

                const spriteByte = RAM[iRegister + i]

                for (let j = 0; j < 8; j++) {
                    if (VX + j >= DISPLAY_WIDTH) {
                        break
                    }

                    const pixelIndex = (VY + i) * DISPLAY_WIDTH + (VX + j)
                    const spritePixel = (spriteByte >> (7 - j)) & 1

                    if (spritePixel === 1) {
                        if (display[pixelIndex] === 1) {
                            display[pixelIndex] = 0
                            V[0xf] = 1
                        } else {
                            display[pixelIndex] = 1
                        }
                    }
                }
            }
            doRender = true
            break
        }
        case 0x0e:
            switch (N) {
                case 0x0e: {
                    if (isKeyPressed(V[X])) {
                        programCounter += 2
                    }

                    break
                }
                case 0x01: {
                    if (!isKeyPressed(V[X])) {
                        programCounter += 2
                    }

                    break
                }
            }

            break
        case 0x0f:
            switch (Y) {
                case 0x00: {
                    switch (N) {
                        case 0x07: {
                            V[X] = delayTimer
                            break
                        }
                        case 0x0a: {
                            if (!holdForKey) {
                                resetKeyReleased()
                            }
                            holdForKey = true

                            for (let i = 0; i < 16; i++) {
                                if (isKeyReleased(i)) {
                                    keyReleased = i
                                    break
                                }
                            }

                            if (keyReleased !== -1) {
                                V[X] = keyReleased
                                keyReleased = -1
                                holdForKey = false
                            } else {
                                programCounter -= 2
                            }

                            break
                        }
                    }

                    if (N === 0x07) {
                        //TODO: NOOP
                    }

                    break
                }
                case 0x01: {
                    switch (N) {
                        case 0x05: {
                            delayTimer = V[X]

                            break
                        }
                        case 0x08: {
                            soundTimer = V[X]

                            break
                        }
                        case 0x0e: {
                            iRegister += V[X]

                            // amiga quirk - fix for spacefight 2091

                            if (iRegister > 0x0fff) {
                                V[0x0f] = 1
                            }

                            break
                        }
                    }

                    break
                }

                case 0x03: {
                    if (N === 0x03) {
                        const value = V[X]
                        RAM[iRegister] = Math.floor(value / 100)
                        RAM[iRegister + 1] = Math.floor((value / 10) % 10)
                        RAM[iRegister + 2] = value % 10
                        break
                    }
                    break
                }

                case 0x05: {
                    //TODO: IMPLEMENT QUIRK

                    if (N === 5) {
                        for (let i = 0; i <= X; i++) {
                            RAM[iRegister++] = V[i]
                        }
                    }
                    break
                }
                case 0x06: {
                    //TODO IMPLEMENT QUIRK

                    if (N === 5) {
                        for (let i = 0; i <= X; i++) {
                            V[i] = RAM[iRegister++]
                        }
                    }

                    break
                }
            }

            break
    }
}

/*

const printout = () => {
    for (let line = 0; line < DISPLAY_HEIGHT; line++) {
        const row = display
            .slice(line * DISPLAY_WIDTH, (line + 1) * DISPLAY_WIDTH)
            .map((pixel) => (pixel ? '█' : ' ')) // Convert 1 → "█", 0 → " "
        console.log(row.join('')) // Print the row
    }
    console.log()

    console.log()
}
*/

export const start = () => {
    run()
}

const CHIP8_CLOCK_HZ = 700
const FRAME_RATE = 60
const INSTRUCTIONS_PER_FRAME = Math.floor(CHIP8_CLOCK_HZ / FRAME_RATE)
const TARGET_TICK_RATE = 1 / FRAME_RATE

const run = () => {
    let lastTime = 0
    let accumulator = 0
    const doRun = (currentTime: number) => {
        const deltaTime = (currentTime - lastTime) / 1000
        lastTime = currentTime
        accumulator += deltaTime

        for (let i = 0; i < INSTRUCTIONS_PER_FRAME && !doRender; i++) {
            execute()
        }

        if (accumulator >= TARGET_TICK_RATE) {
            if (delayTimer > 0) {
                delayTimer--
            }
            if (soundTimer > 0) {
                soundTimer--
            }
            renderDisplay(display)
            doRender = false
            accumulator -= TARGET_TICK_RATE
        }

        requestAnimationFrame(doRun)
    }
    lastTime = performance.now()
    requestAnimationFrame(doRun)
}
