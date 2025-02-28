class Uint16Stack extends Uint16Array {
    private _top: number = -1

    constructor(size: number) {
        super(size)
    }

    push(value: number): void {
        if (this._top + 1 >= this.length) {
            throw new Error('Stack overflow')
        }
        this[++this._top] = value
    }

    pop(): number {
        if (this._top < 0) {
            throw new Error('Stack underflow')
        }
        return this[this._top--]
    }

    peek(): number {
        if (this._top < 0) {
            throw new Error('Stack is empty')
        }
        return this[this._top]
    }

    isEmpty(): boolean {
        return this._top === -1
    }

    isFull(): boolean {
        return this._top + 1 === this.length
    }
}

export default Uint16Stack
