import { loadRomFile } from './chip8'

const romLoaderInput = document.querySelector<HTMLInputElement>('#romLoader')

if (!romLoaderInput) {
    throw new Error('Rom loader not found')
}

romLoaderInput.addEventListener('change', (event) => {
    const fileEvent = event.target as HTMLInputElement
    if (!fileEvent.files) {
        return
    }
    const file = fileEvent.files[0] // Get the selected file
    if (!file) return

    const reader = new FileReader()
    reader.onload = function () {
        const arrayBuffer = reader.result // Binary data as an ArrayBuffer
        if (arrayBuffer !== null) {
            loadRomFile(new Uint8Array(arrayBuffer as ArrayBuffer))
        }
    }

    reader.readAsArrayBuffer(file) // Read file as binary data
})
