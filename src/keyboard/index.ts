const keyMap: { [key: string]: number } = {
    Digit1: 0x1, // 1
    Digit2: 0x2, // 2
    Digit3: 0x3, // 3
    Digit4: 0xc, // 4
    KeyQ: 0x4, // Q
    KeyW: 0x5, // W
    KeyE: 0x6, // E
    KeyR: 0xd, // R
    KeyA: 0x7, // A
    KeyS: 0x8, // S
    KeyD: 0x9, // D
    KeyF: 0xe, // F
    KeyZ: 0xa, // Z
    KeyX: 0x0, // X
    KeyC: 0xb, // C
    KeyV: 0xf, // V
}

const keyState: boolean[] = new Array(16).fill(false)

document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = keyMap[event.code]
    if (key !== undefined) {
        keyState[key] = true
        event.preventDefault() // Prevent default behavior (e.g., scrolling)
    }
})

document.addEventListener('keyup', (event) => {
    const key = keyMap[event.code]
    if (key !== undefined) {
        keyState[key] = false
        event.preventDefault()
    }
})

const isKeyPressed = (chip8Key: number) => keyState[chip8Key]

export { isKeyPressed }
