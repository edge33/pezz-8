const keyMap: { [key: string]: number } = {
    "Digit1": 0x1, "Digit2": 0x2, "Digit3": 0x3, "Digit4": 0xC, // 1, 2, 3, 4
    "KeyQ": 0x4, "KeyW": 0x5, "KeyE": 0x6, "KeyR": 0xD,       // Q, W, E, R
    "KeyA": 0x7, "KeyS": 0x8, "KeyD": 0x9, "KeyF": 0xE,       // A, S, D, F
    "KeyZ": 0xA, "KeyX": 0x0, "KeyC": 0xB, "KeyV": 0xF        // Z, X, C, V
};

const keyState: boolean[] = new Array(16).fill(false);

document.addEventListener("keydown", (event: KeyboardEvent) => {
    const key = keyMap[event.code];
    if (key !== undefined) {
        keyState[key] = true;
        event.preventDefault(); // Prevent default behavior (e.g., scrolling)
    }
});

document.addEventListener("keyup", (event) => {
    const key = keyMap[event.code];
    if (key !== undefined) {
        keyState[key] = false;
        event.preventDefault();
    }
});


const isKeyPressed = (chip8Key: number) => keyState[chip8Key];


export { isKeyPressed };

